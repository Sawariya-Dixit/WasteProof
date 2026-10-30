import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { connectDB } from '../config/db.js';
import { createRedis } from '../config/redis.js';
import { REPORT_QUEUE, WORKER_CONCURRENCY } from '../config/defaults.js';
import { Report } from '../models/Report.js';
import { logger } from '../utils/logger.js';
import { runPipeline } from './pipeline.js';

async function start() {
  await connectDB();
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
    { connection, concurrency: WORKER_CONCURRENCY },
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
  logger.info(`Worker ready, queue=${REPORT_QUEUE}, concurrency=${WORKER_CONCURRENCY}`);

  const shutdown = async (signal) => {
    logger.info(`${signal} received, worker band ho raha hai`);
    await worker.close(); // chalte hue job ko khatam hone do
    await connection.quit();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error(err, 'Worker startup failed');
  process.exit(1);
});
