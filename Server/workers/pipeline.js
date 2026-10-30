import { Report } from '../models/Report.js';

// ---- Day 6: sab stubs hain. Din 8-12 me asli logic aayega ----
async function moderate(report, log) {
  // Day 9: unsafe image check
  log.info('step: moderate (stub)');
}

async function blur(report, log) {
  // Day 8-9: faces + plates blur, public copy upload
  log.info('step: blur (stub)');
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

export const STEPS = [
  { name: 'moderate', run: moderate },
  { name: 'blur', run: blur },
  { name: 'checks', run: checks },
  { name: 'verify', run: verify },
  { name: 'merge', run: merge },
  { name: 'locate', run: locate },
];

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

    // Retry test ke liye: note me FAIL_TEST likho. Test ke baad ye 3 lines hata dena.
    if (step.name === 'checks' && report.note === 'FAIL_TEST') {
      throw new Error('Test failure (FAIL_TEST)');
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
