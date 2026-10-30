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

export async function closeReportQueue() {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
