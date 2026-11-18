import { Report } from '../models/Report.js';
import { AdminLog } from '../models/AdminLog.js';
import { AppError } from '../utils/AppError.js';
import { ADMIN, PIPELINE_STEP_NAMES } from '../config/defaults.js';
import { getReportQueue, requeueReport } from '../queues/reportQueue.js';
import { logger } from '../utils/logger.js';

const REVIEW = ADMIN.reviewStatuses;

// Admin ko sirf BLURRED photo dikhti hai. originalKey select:false hai, yahan kabhi nahi aati.
function toRow(r) {
  const steps = r.pipeline?.steps ?? {};
  const v = r.pipeline?.verify;
  return {
    id: r._id,
    userId: r.userId, // opaque id, email/naam nahi
    type: r.type,
    status: r.status,
    blurredUrl: r.blurredUrl ?? null,
    note: r.note ?? null,
    location: { lat: r.location.coordinates[1], lng: r.location.coordinates[0] },
    accuracyM: r.accuracyM ?? null,
    capturedAt: r.capturedAt,
    createdAt: r.createdAt,
    attempts: r.attempts ?? 0,
    reason: r.pipeline?.rejectReason ?? null,
    lastError: r.pipeline?.lastError ?? null,
    failedStep: r.status === 'needs_review' ? (PIPELINE_STEP_NAMES.find((n) => !steps[n]?.done) ?? null) : null,
    verify: v
      ? {
          probability: v.probability ?? null,
          verdict: v.verdict ?? null,
          decision: v.decision ?? null,
          llmReason: v.llm?.reason ?? null,
        }
      : null,
  };
}

const SELECT = 'userId type status blurredUrl note location accuracyM capturedAt createdAt attempts pipeline';

export async function listReviewReports({ status, page, limit }) {
  const filter = { status: status ?? { $in: REVIEW } };
  const [rows, total] = await Promise.all([
    Report.find(filter) // sabse purani pehle
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(SELECT)
      .lean(),
    Report.countDocuments(filter),
  ]);
  return { reports: rows.map(toRow), total };
}

export async function getReviewReport(id) {
  const r = await Report.findById(id).select(SELECT).lean();
  if (!r) throw new AppError('Report nahi mili', 404, 'NOT_FOUND');
  return toRow(r);
}

// approve = admin ne AI judge ki jagah fayesla diya: verify step "done" maano, baaki steps (blur, merge, locate)
//           chalte hain. Site phir bhi tabhi verified hogi jab 10 alag log confirm karein.
// reject  = report rejected.
// retry   = sirf needs_review (job fail hua tha): bina kuch badle pipeline dobara chalao.
export async function reviewReport(adminId, id, { action, reason }) {
  const report = await Report.findOne({ _id: id, status: { $in: REVIEW } }).select('status').lean();
  if (!report) {
    throw new AppError('Report review queue me nahi hai (shayad pehle hi decide ho chuki)', 409, 'NOT_IN_QUEUE');
  }
  if (action === 'retry' && report.status !== 'needs_review') {
    throw new AppError('Retry sirf needs_review report par ho sakta hai', 409, 'RETRY_NOT_ALLOWED');
  }

  const now = new Date();
  const adminNote = { action, reason: reason ?? null, by: adminId, at: now };
  let update;
  if (action === 'reject') {
    update = { $set: { status: 'rejected', 'pipeline.rejectReason': 'admin_rejected', 'pipeline.admin': adminNote } };
  } else {
    const $set = { status: 'pending', attempts: 0, 'pipeline.admin': adminNote };
    if (action === 'approve') {
      $set['pipeline.steps.verify'] = { done: true, at: now, result: { decision: 'approved_by_admin' } };
    }
    update = { $set, $unset: { 'pipeline.rejectReason': '', 'pipeline.lastError': '' } };
  }

  // Filter me purana status bhi: do admin ek saath click karein to sirf ek jeetega
  const res = await Report.updateOne({ _id: id, status: report.status }, update);
  if (res.modifiedCount === 0) {
    throw new AppError('Kisi aur admin ne ise pehle hi decide kar diya', 409, 'NOT_IN_QUEUE');
  }

  await AdminLog.create({
    adminId,
    action: `report.${action}`,
    targetType: 'report',
    targetId: String(id),
    reason,
    meta: { from: report.status },
  });

  if (action !== 'reject') {
    // Queue fail ho to bhi theek: requeuePending sweeper pending report ko dobara utha lega
    try {
      await requeueReport(id);
    } catch (err) {
      logger.error({ err, reportId: String(id) }, 'admin requeue fail, sweeper uthayega');
    }
  }
  return { id, status: action === 'reject' ? 'rejected' : 'pending' };
}

export async function queueStats() {
  const queue = getReportQueue();
  const [jobs, failed, byStatus] = await Promise.all([
    queue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed'),
    queue.getFailed(0, ADMIN.failedJobsShown - 1),
    Report.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  return {
    jobs,
    failed: failed.map((j) => ({
      reportId: j.data?.reportId ?? null,
      attempts: j.attemptsMade,
      reason: String(j.failedReason ?? '').slice(0, 200),
      at: j.finishedOn ? new Date(j.finishedOn) : null,
    })),
    reports: Object.fromEntries(byStatus.map((r) => [r._id, r.n])),
  };
}