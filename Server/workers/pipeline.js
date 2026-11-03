import { Report } from '../models/Report.js';
import {
  PIPELINE_STEP_NAMES,
  PLATE_BLUR_PAD,
  REPORT_MAX_AGE_MS,
  CLOCK_SKEW_MS,
  PHASH_MAX_DISTANCE,
  PHASH_LOOKBACK_DAYS,
  PHASH_MAX_COMPARE,
  LLM_IMAGE_WIDTH,
} from '../config/defaults.js';
import { env } from '../config/env.js';
import {
  downloadOriginal,
  deleteOriginal,
  uploadBlurred,
  downloadBlurred,
} from '../services/storageService.js';
import {
  prepareImage,
  blurRegions,
  toNormalized,
  toPixels,
  computePHash,
} from '../services/blurService.js';
import { attachReportToSite } from '../services/siteMergeService.js';
import { detectFaces } from '../ai/faceDetector.js';
import { scanImage } from '../ai/privacyScan.js';
import { judgeFromLabels } from '../ai/visionJudge.js';
import { judgeWithGroq } from '../ai/groqJudge.js';
import { decide } from '../ai/decision.js';
import { inIndia } from '../utils/geo.js';
import { hammingHex } from '../utils/phash.js';
import { locateSite } from '../services/locateService.js';
// Koi step ise throw kare to pipeline wahin ruk jati hai aur report ka status badal jata hai.
// Job fail nahi maana jata, isliye retry bhi nahi hota.
export class PipelineStop extends Error {
  constructor(status, reason) {
    super(`${status}: ${reason}`);
    this.status = status;
    this.reason = reason;
  }
}

// Step 1: safety + privacy scan. Result DB me rehta hai, isliye blur retry hone par AWS dobara nahi bulata
async function moderate(report, log) {
  const full = await Report.findById(report._id).select('+originalKey');
  const original = await downloadOriginal(full.originalKey);
  const raw = await prepareImage(original);

  // Pehle local face blur, phir wahi copy Rekognition ko. Poori unblurred photo third-party ko nahi jaati
  const localFaces = await detectFaces(raw);
  const preview = await blurRegions(raw, localFaces);
  const scan = await scanImage(preview);

  if (scan.unsafe) {
    // Unsafe photo ko storage me rakhna theek nahi, original delete karo
    await deleteOriginal(full.originalKey).catch((err) =>
      log.error({ err }, 'unsafe original delete nahi ho paya'),
    );
    throw new PipelineStop('rejected', 'unsafe_image');
  }

  log.info(
    {
      localFaces: localFaces.length,
      awsFaces: scan.faces.length,
      plates: scan.plates.length,
      mode: scan.skipped ? 'local_only' : 'rekognition',
    },
    'step: moderate done',
  );
  return {
    scanMode: scan.skipped ? 'local_only' : 'rekognition',
    localFaces: toNormalized(localFaces, raw.info),
    llmFaces: scan.faces, // naam purana hai, ab Rekognition ke faces hain (blur step isi naam se padhta hai)
    plates: scan.plates,
    labels: scan.labels ?? [], // verify step yahin se padhta hai
    pHash: await computePHash(raw), // checks step duplicate dekhne ke liye (Day 11)
  };
}

// Step 2: saare boxes blur karo, public copy upload karo. Shak ho to zyada blur (plates par bada pad)
async function blur(report, log) {
  const full = await Report.findById(report._id).select('+originalKey');
  const scan = full.pipeline?.steps?.moderate?.result;
  if (!scan) throw new Error('moderate ka result nahi mila, blur nahi kar sakte');

  const original = await downloadOriginal(full.originalKey);
  const raw = await prepareImage(original);

  const faceBoxes = [...scan.localFaces, ...scan.llmFaces];
  const plateBoxes = scan.plates.map((b) => ({ ...b, pad: PLATE_BLUR_PAD }));
  const jpeg = await blurRegions(raw, toPixels([...faceBoxes, ...plateBoxes], raw.info));

  // Public copy: sirf blurred, EXIF/GPS nahi. overwrite=true hai, retry me double upload nahi hota
  const uploaded = await uploadBlurred(jpeg, report._id);
  await Report.updateOne({ _id: report._id }, { $set: { blurredUrl: uploaded.secure_url } });

  log.info({ faces: faceBoxes.length, plates: plateBoxes.length }, 'step: blur done');
  return { faces: faceBoxes.length, plates: plateBoxes.length };
}

// Step 3 (Day 11): server par dobara India bounds, time, aur same user ki purani photo se duplicate.
// Client ya API par bharosa nahi: worker khud check karta hai.
async function checks(report, log) {
  const full = await Report.findById(report._id).select(
    '+originalKey userId location capturedAt createdAt pipeline',
  );
  const [lng, lat] = full.location.coordinates;
  if (!inIndia(lat, lng)) throw new PipelineStop('rejected', 'outside_india');

  // Queue me der lagi ho to worker ki ghadi se nahi, report aane ke time (createdAt) se naapo
  const ageMs = full.createdAt.getTime() - full.capturedAt.getTime();
  if (ageMs > REPORT_MAX_AGE_MS + CLOCK_SKEW_MS || ageMs < -CLOCK_SKEW_MS) {
    throw new PipelineStop('rejected', 'stale_photo');
  }

  let pHash = full.pipeline?.steps?.moderate?.result?.pHash;
  if (!pHash) {
    // Purani report (Day 11 se pehle moderate hua tha): original se nikalo
    pHash = await computePHash(await prepareImage(await downloadOriginal(full.originalKey)));
  }
  await Report.updateOne({ _id: full._id }, { $set: { pHash } });

  // Usi user ki pichhli reports (rejected wali nahi: saaf photo dobara lena allowed hona chahiye)
  const since = new Date(Date.now() - PHASH_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const others = await Report.find({
    userId: full.userId,
    _id: { $ne: full._id },
    pHash: { $exists: true, $ne: null },
    status: { $ne: 'rejected' },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .limit(PHASH_MAX_COMPARE)
    .select('pHash')
    .lean();

  const nearest = others.reduce((m, o) => Math.min(m, hammingHex(o.pHash, pHash)), 64);
  if (nearest <= PHASH_MAX_DISTANCE) throw new PipelineStop('rejected', 'duplicate_image');

  log.info({ compared: others.length, nearest }, 'step: checks done');
  return { pHashDistance: others.length ? nearest : null, compared: others.length };
}

// Step 4 (Day 11): waste judge. Rekognition labels + (optional) Groq vision, phir decide().
async function verify(report, log) {
  const full = await Report.findById(report._id).select('type blurredUrl pipeline');
  const scan = full.pipeline?.steps?.moderate?.result;
  if (!scan) throw new Error('moderate ka result nahi mila, verify nahi kar sakte');

  // PRIVACY_SCAN=local me labels khaali hote hain; unhe 'no' maan lena galat hoga, isliye judge hi nahi
  const labels = scan.scanMode === 'rekognition' ? judgeFromLabels(scan.labels ?? [], full.type) : null;

  // LLM judge sirf blurred copy dekhta hai. Pichhle attempt ka jawab DB me ho to dobara call nahi
  let llm = full.pipeline?.verify?.llm?.verdict ? full.pipeline.verify.llm : null;
  let llmError = null;
  if (!llm && env.VERIFY_LLM === 'on' && env.GROQ_API_KEY) {
    try {
      const jpeg = await downloadBlurred(full.blurredUrl, LLM_IMAGE_WIDTH);
      llm = await judgeWithGroq(jpeg, full.type);
    } catch (err) {
      // LLM sirf doosra raay hai: down ya rate-limit ho to labels se kaam chalao, job fail mat karo
      llmError = err.message;
      log.warn({ err: err.message }, 'Groq judge fail, sirf Rekognition labels se decide kar rahe hain');
    }
  }

  const decision = decide({ labels, llm });
  if (decision.status === 'no_judge') {
    // Na labels (PRIVACY_SCAN=local) na LLM: auto-pass karna galat hoga, admin dekhega
    throw new PipelineStop('needs_review', 'no_judge_available');
  }

  // Poora hisaab report me (admin aur "kya check hua" ke liye). Step "done" na bhi ho tab bhi bacha rehta hai
  await Report.updateOne(
    { _id: report._id },
    {
      $set: {
        'pipeline.verify': {
          labels,
          llm,
          llmError,
          probability: decision.probability,
          verdict: decision.verdict,
          decision: decision.status,
          at: new Date(),
        },
      },
    },
  );
  log.info(
    { decision: decision.status, p: decision.probability, sources: decision.sources },
    'step: verify done',
  );

  if (decision.status !== 'passed') throw new PipelineStop(decision.status, decision.reason);
  return { decision: 'passed', probability: decision.probability };
}

// Step 5 (Day 10 ka siteMergeService): 20 m ke andar ki site me jodo ya nayi banao
async function merge(report, log) {
  const r = await attachReportToSite(report._id);
  log.info({ siteId: String(r.siteId), joined: r.joined, distanceM: r.distanceM }, 'step: merge done');
  return { siteId: String(r.siteId), joined: r.joined, distanceM: r.distanceM };
}

// Step 6 (Day 12): site ke ward / MLA seat / MP seat / district, local body aur paas ki jagah
async function locate(report, log) {
  const full = await Report.findById(report._id).select('siteId');
  if (!full?.siteId) throw new Error('Report par siteId nahi hai (merge step pehle chalna chahiye)');
  const r = await locateSite(full.siteId, log);
  log.info(r, 'step: locate done');
  return r;
}
const IMPL = { moderate, blur, checks, verify, merge, locate };

// Order ek hi jagah (config/defaults.js) se aata hai, API ke "checks" list se match rehta hai
export const STEPS = PIPELINE_STEP_NAMES.map((name) => ({ name, run: IMPL[name] }));

export async function runPipeline(reportId, log) {
  const report = await Report.findById(reportId);
  if (!report) {
    log.warn('Report DB me nahi mili, skip');
    return;
  }
  // Idempotent: pehle hi decide ho chuki report dobara nahi chalegi
  if (report.status !== 'pending') {
    log.info({ status: report.status }, 'Report pending nahi hai, skip');
    return;
  }

  for (const step of STEPS) {
    if (report.pipeline?.steps?.[step.name]?.done) {
      log.info(`step ${step.name} pehle ho chuka, skip`);
      continue;
    }

    let result;
    try {
      result = await step.run(report, log);
    } catch (err) {
      if (err instanceof PipelineStop) {
        await Report.updateOne(
          { _id: report._id, status: 'pending' },
          { $set: { status: err.status, 'pipeline.rejectReason': err.reason } },
        );
        log.warn({ reason: err.reason }, `report -> ${err.status}`);
        return;
      }
      throw err; // baaki errors par BullMQ retry karega
    }

    await Report.updateOne(
      { _id: report._id },
      {
        $set: {
          [`pipeline.steps.${step.name}`]: { done: true, at: new Date(), result: result ?? null },
        },
      },
    );
  }

  // Saare steps ho gaye: ab report 'passed' hai (site ban chuki hai ya jud chuki hai)
  await Report.updateOne({ _id: report._id, status: 'pending' }, { $set: { status: 'passed' } });
  log.info('report -> passed');
}
