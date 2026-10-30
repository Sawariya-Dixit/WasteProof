import { Report } from '../models/Report.js';
import { enqueueReport } from '../queues/reportQueue.js';
import { logger } from '../utils/logger.js';

// Safety net: DB me save hui par queue me na gayi (ya kho gayi) reports dobara queue me daalo.
// jobId = reportId hai, isliye jo job Redis me pehle se hai usse dobara add karne par duplicate nahi banta.
export async function requeuePending({ olderThanMs, limit = 100 }) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const stuck = await Report.find({
    status: 'pending',
    createdAt: { $lt: cutoff },
    'pipeline.steps.locate.done': { $ne: true }, // pipeline poori ho chuki ho to chhod do
  })
    .select('_id')
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  for (const r of stuck) {
    await enqueueReport(r._id);
  }
  if (stuck.length) logger.warn({ count: stuck.length }, 'requeuePending: atki reports dobara queue me daali');
  return stuck.length;
}
