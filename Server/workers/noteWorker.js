import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { connectDB } from '../config/db.js';
import { createRedis } from '../config/redis.js';
import { NOTE_QUEUE, NOTES } from '../config/defaults.js';
import { logger } from '../utils/logger.js';
import { summarizeSite } from '../services/noteSummaryService.js';
import { assertProductionSafe } from '../config/prodGuard.js';
import { isMain } from '../utils/isMain.js';

// Notes ke AI summary ka worker. DB pehle se connected hona chahiye.
// Do tarike: (1) server.js ke andar (EMBEDDED_WORKERS=on), (2) alag process: npm run worker:notes
export async function startNoteWorker() {
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

  return {
    async close() {
      await worker.close();
      await connection.quit();
    },
  };
}

// ---- Alag process: npm run worker:notes ----
async function standalone() {
  assertProductionSafe();
  await connectDB();
  const w = await startNoteWorker();

  const shutdown = async (signal) => {
    logger.info(`${signal} received, note worker band ho raha hai`);
    await w.close();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (isMain(import.meta.url)) {
  standalone().catch((err) => {
    logger.error(err, 'Note worker startup failed');
    process.exit(1);
  });
}