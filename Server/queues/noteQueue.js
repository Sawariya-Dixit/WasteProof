import { Queue } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { NOTE_QUEUE, NOTES } from '../config/defaults.js';

let queue;

export function getNoteQueue() {
  if (!queue) {
    queue = new Queue(NOTE_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true, // warna wahi jobId 1 ghante tak dobara add nahi hota
        removeOnFail: { count: 100 },
      },
    });
  }
  return queue;
}

// Naya note aane par summary dobara banao. Thodi der ruk kar (kai notes ek saath), ek site ke liye ek hi job.
// jobId me time-bucket hai: ek bucket me kai notes = ek job; chalte hue job ke dauran aaya note agle bucket me jata hai.
export function enqueueSummary(siteId) {
  const bucket = Math.floor(Date.now() / NOTES.summaryDelayMs);
  return getNoteQueue().add(
    'summarize',
    { siteId: String(siteId) },
    { jobId: `site-${siteId}-${bucket}`, delay: NOTES.summaryDelayMs },
  );
}

export async function closeNoteQueue() {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}