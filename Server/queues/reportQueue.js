import { Queue } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { REPORT_QUEUE, REPORT_JOB_ATTEMPTS, REPORT_JOB_BACKOFF_MS } from '../config/defaults.js';

let queue;

export function getReportQueue() {
  if (!queue) {
    queue = new Queue(REPORT_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: REPORT_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: REPORT_JOB_BACKOFF_MS },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: false, // failed jobs rakho = hamara DLQ, admin dekhega
      },
    });
  }
  return queue;
}

// jobId = reportId, isse same report do baar queue me nahi jaati (idempotent)
export function enqueueReport(reportId) {
  const id = String(reportId);
  return getReportQueue().add('process-report', { reportId: id }, { jobId: id });
}

// Day 11: reporter ne confirm kiya, ab report dobara chalani hai. Purana (completed) job Redis me
// 1 ghanta pada rehta hai aur same jobId dobara add karne par chupchaap ignore ho jata hai, isliye pehle hatao.
export async function requeueReport(reportId) {
  const id = String(reportId);
  const queue = getReportQueue();
  const old = await queue.getJob(id);
  if (old) await old.remove().catch(() => {});
  return queue.add('process-report', { reportId: id }, { jobId: id });
}

export async function closeReportQueue() {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
