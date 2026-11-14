import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { connectDB } from '../config/db.js';
import { createRedis } from '../config/redis.js';
import { NOTE_QUEUE, NOTES } from '../config/defaults.js';
import { logger } from '../utils/logger.js';
import { summarizeSite } from '../services/noteSummaryService.js';

// Alag process: npm run worker:notes  (report worker ke saath ek aur terminal me)
async function start() {
  await connectDB();
  const connection = createRedis('redis(note-worker)');

  const worker = new Worker(
    NOTE_QUEUE,
    async (job) => {
      const log = logger.child({ jobId: job.id, siteId: job.data.siteId, attempt: job.attemptsMade + 1 });
      const result = await summarizeSite(job.data.siteId, log);
      log.info(result, 'note summary done');
    },
    {
      connection,
      concurrency: NOTES.concurrency,
      limiter: { max: 20, duration: 60_000 }, // LLM ki rate limit ka khayal
    },
  );

  worker.on('failed', (job, err) =>
    logger.error({ err: err.message, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'note job failed'),
  );
  worker.on('error', (err) => logger.error({ err }, 'note worker error'));
  logger.info(`Note worker ready, queue=${NOTE_QUEUE}`);

  const shutdown = async (signal) => {
    logger.info(`${signal} received, note worker band ho raha hai`);
    await worker.close();
    await connection.quit();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error(err, 'Note worker startup failed');
  process.exit(1);
});