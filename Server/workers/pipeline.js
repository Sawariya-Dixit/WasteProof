import fs from 'node:fs/promises';
import path from 'node:path';
import { Report } from '../models/Report.js';
import { env } from '../config/env.js';
import { PIPELINE_STEP_NAMES } from '../config/defaults.js';
import { downloadOriginal } from '../services/storageService.js';
import { prepareImage, blurRegions } from '../services/blurService.js';
import { detectFaces } from '../ai/faceDetector.js';

async function moderate(report, log) {
  // Day 9: unsafe image check
  log.info('step: moderate (stub)');
}

async function blur(report, log) {
  // originalKey select:false hai, isliye alag se maango
  const full = await Report.findById(report._id).select('+originalKey');
  const original = await downloadOriginal(full.originalKey);

  const raw = await prepareImage(original);
  const faces = await detectFaces(raw);
  // Day 9: yahan number plates ke boxes jodenge aur public copy upload hogi
  const jpeg = await blurRegions(raw, faces);

  // Abhi public upload nahi hai. Dev me blurred copy local folder me rakho taaki aap dekh sako
  if (env.NODE_ENV === 'development') {
    const dir = path.resolve('tmp/blurred');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${report._id}.jpg`), jpeg);
  }

  log.info({ faces: faces.length, width: raw.info.width, height: raw.info.height }, 'step: blur done');
  return { faces: faces.length };
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

    const result = await step.run(report, log);

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