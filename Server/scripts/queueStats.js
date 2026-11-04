// Use: npm run stats:queue   (BullMQ me kitne jobs, aur failed jobs ka reason)
import { getReportQueue, closeReportQueue } from '../queues/reportQueue.js';

const queue = getReportQueue();
console.log('Job counts:', await queue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed'));

const failed = await queue.getFailed(0, 9);
if (failed.length) {
  console.log('\nFailed jobs (aakhri 10):');
  console.table(
    failed.map((j) => ({
      jobId: j.id,
      attempts: j.attemptsMade,
      reason: String(j.failedReason).slice(0, 100),
    })),
  );
}
await closeReportQueue();
process.exit(0);