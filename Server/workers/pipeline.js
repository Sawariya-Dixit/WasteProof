import { Report } from '../models/Report.js';
import { PIPELINE_STEP_NAMES, PLATE_BLUR_PAD } from '../config/defaults.js';
import { downloadOriginal, deleteOriginal, uploadBlurred } from '../services/storageService.js';
import { prepareImage, blurRegions, toNormalized, toPixels } from '../services/blurService.js';
import { detectFaces } from '../ai/faceDetector.js';
import { scanImage } from '../ai/privacyScan.js';

// Koi step ise throw kare to pipeline wahin ruk jati hai aur report ka status badal jata hai.
// Job fail nahi maana jata, isliye retry bhi nahi hota.
export class PipelineStop extends Error {
  constructor(status, reason) {
    super(`${status}: ${reason}`);
    this.status = status;
    this.reason = reason;
  }
}

// Step 1: safety + privacy scan. Result DB me rehta hai, isliye blur retry hone par Gemini dobara nahi bulata
async function moderate(report, log) {
  const full = await Report.findById(report._id).select('+originalKey');
  const original = await downloadOriginal(full.originalKey);
  const raw = await prepareImage(original);

  // Pehle local face blur, phir wahi copy Gemini ko. Poori unblurred photo third-party ko nahi jaati
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
    labels: scan.labels ?? [], // Day 11 verify step yahin se padhega
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

async function checks(report, log) {
  // Day 10: India bounds, pHash duplicate, rate limits dobara
  log.info('step: checks (stub)');
}

async function verify(report, log) {
  // Day 10-11: vision LLM judge + decision
  log.info('step: verify (stub)');
}

async function merge(report, log) {
  // Day 10: 20 m site merge + Redis lock
  log.info('step: merge (stub)');
}

async function locate(report, log) {
  // Day 12: assembly / Lok Sabha / nearby places
  log.info('step: locate (stub)');
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
}