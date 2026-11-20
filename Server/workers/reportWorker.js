import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { connectDB } from '../config/db.js';
import { createRedis, closeRedis } from '../config/redis.js';
import {
  REPORT_QUEUE,
  WORKER_CONCURRENCY,
  REQUEUE_AFTER_MS,
  REQUEUE_EVERY_MS,
} from '../config/defaults.js';
import { Report } from '../models/Report.js';
import { logger } from '../utils/logger.js';
import { runPipeline } from './pipeline.js';
import { requeuePending } from '../jobs/requeuePending.js';
import { assertProductionSafe } from '../config/prodGuard.js';
import { isMain } from '../utils/isMain.js';

// Redis commands bachane ke liye (Upstash free = 500K/month). Idle worker bhi Redis ko "poll" karta hai:
// drainDelay = queue khali ho to itne SECOND tak ek hi blocking call me ruko (default 5 = har 5s ek command).
// Naya job aate hi BullMQ marker se worker turant jaag jata hai, isliye 60s rakhne se job late nahi hota.
// stalledInterval = atke hue jobs ki jaanch kitne ms me (default 30s).
const IDLE = { drainDelay: 60, stalledInterval: 120_000 };

// Worker shuru karo. DB pehle se connected hona chahiye.
// Do tarike: (1) server.js ke andar (EMBEDDED_WORKERS=on), (2) alag process: npm run worker
export async function startReportWorker() {
  const connection = createRedis('redis(worker)');

  const worker = new Worker(
    REPORT_QUEUE,
    async (job) => {
      const log = logger.child({
        jobId: job.id,
        reportId: job.data.reportId,
        attempt: job.attemptsMade + 1,
      });
      log.info('job start');
      await runPipeline(job.data.reportId, log);
      log.info('job done');
    },
    { connection, concurrency: WORKER_CONCURRENCY, ...IDLE },
  );

  // Jab koi attempt fail ho
  worker.on('failed', async (job, err) => {
    if (!job) return;
    logger.error({ err, jobId: job.id, attemptsMade: job.attemptsMade }, 'job failed');
    try {
      await Report.updateOne(
        { _id: job.data.reportId },
        { $inc: { attempts: 1 }, $set: { 'pipeline.lastError': err.message } },
      );
      // Saare attempts khatam = needs_review (admin dekhega, job failed list me rahega)
      if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await Report.updateOne(
          { _id: job.data.reportId, status: 'pending' },
          { $set: { status: 'needs_review' } },
        );
        logger.warn({ reportId: job.data.reportId }, 'report -> needs_review');
      }
    } catch (e) {
      logger.error({ err: e }, 'failed-handler me DB error');
    }
  });

  worker.on('error', (err) => logger.error({ err }, 'worker error'));

  // Safety net: har REQUEUE_EVERY_MS par atki pending reports dobara queue me
  const sweep = () =>
    requeuePending({ olderThanMs: REQUEUE_AFTER_MS }).catch((err) =>
      logger.error({ err }, 'requeuePending failed'),
    );
  sweep(); // start par ek baar
  const sweeper = setInterval(sweep, REQUEUE_EVERY_MS);
  logger.info(`Worker ready, queue=${REPORT_QUEUE}, concurrency=${WORKER_CONCURRENCY}`);

  return {
    async close() {
      clearInterval(sweeper);
      await worker.close(); // chalte hue job ko khatam hone do
      await connection.quit();
    },
  };
}

// ---- Alag process: npm run worker ----
async function standalone() {
  assertProductionSafe();
  await connectDB();
  const w = await startReportWorker();

  const shutdown = async (signal) => {
    logger.info(`${signal} received, worker band ho raha hai`);
    await w.close();
    await closeRedis(); // site-merge lock wala shared connection
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (isMain(import.meta.url)) {
  standalone().catch((err) => {
    logger.error(err, 'Worker startup failed');
    process.exit(1);
  });
}