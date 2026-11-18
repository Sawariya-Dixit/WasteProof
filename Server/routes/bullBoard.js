import rateLimit from 'express-rate-limit';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { basicAuth } from '../middleware/basicAuth.js';
import { getReportQueue } from '../queues/reportQueue.js';
import { getNoteQueue } from '../queues/noteQueue.js';

export const BULL_BOARD_PATH = '/ops/queues';

export function mountBullBoard(app) {
  if (!env.BULL_BOARD_USER || !env.BULL_BOARD_PASS) {
    logger.info('bull-board band (BULL_BOARD_USER/BULL_BOARD_PASS set nahi)');
    return;
  }
  const adapter = new ExpressAdapter();
  adapter.setBasePath(BULL_BOARD_PATH);
  createBullBoard({
    queues: [new BullMQAdapter(getReportQueue()), new BullMQAdapter(getNoteQueue())],
    serverAdapter: adapter,
    options: { uiConfig: { boardTitle: 'JunkSnap queues' } },
  });
  // Password andaza lagane walon ke liye: 15 min me 30 koshish per IP
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
  app.use(BULL_BOARD_PATH, limiter, basicAuth(env.BULL_BOARD_USER, env.BULL_BOARD_PASS), adapter.getRouter());
  logger.info(`bull-board chalu: ${BULL_BOARD_PATH}`);
}