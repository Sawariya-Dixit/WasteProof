import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { closeReportQueue } from './queues/reportQueue.js';
import { closeRedis } from './config/redis.js';
import { startScoresCron } from './jobs/scoresCron.js';
import { assertProductionSafe } from './config/prodGuard.js';
assertProductionSafe();

// Workers server ke andar hi chalein? Development me default 'on' (ek terminal kaafi hai).
// Production me default 'off': alag worker service chalao, ya EMBEDDED_WORKERS=on karke ek hi service rakho.
const embeddedWorkers = (env.EMBEDDED_WORKERS ?? (env.NODE_ENV === 'production' ? 'off' : 'on')) === 'on';

async function start() {
  await connectDB();
  const server = app.listen(env.PORT, () => logger.info(`API running on port ${env.PORT}`));
  const cronJob = env.SCORES_CRON === 'on' ? startScoresCron() : null;

  // Dynamic import: workers off ho to sharp / AI code load hi nahi hota
  const workers = [];
  if (embeddedWorkers) {
    const { startReportWorker } = await import('./workers/reportWorker.js');
    const { startNoteWorker } = await import('./workers/noteWorker.js');
    workers.push(await startReportWorker(), await startNoteWorker());
    logger.info('Embedded workers on: report + notes server ke andar chal rahe hain');
  }

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    cronJob?.stop();
    server.close(async () => {
      await Promise.all(workers.map((w) => w.close().catch(() => {})));
      await closeReportQueue();
      await closeRedis();
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error(err, 'Startup failed');
  process.exit(1);
});