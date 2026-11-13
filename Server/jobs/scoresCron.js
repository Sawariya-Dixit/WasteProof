import cron from 'node-cron';
import { computeAllScores } from '../services/scoreService.js';
import { SCORES } from '../config/defaults.js';
import { logger } from '../utils/logger.js';

let running = false;

async function runOnce() {
  if (running) {
    logger.warn('scores: pichla run abhi chal raha hai, skip');
    return;
  }
  running = true;
  try {
    await computeAllScores();
  } catch (err) {
    logger.error({ err }, 'scores cron fail hua'); // agle 15 min me dobara chalega
  } finally {
    running = false;
  }
}

export function startScoresCron() {
  const task = cron.schedule(SCORES.cronExpr, runOnce);
  const boot = setTimeout(runOnce, 5000); // server start ke 5 s baad ek run, taaki data pehle se ho
  logger.info(`scores cron on: ${SCORES.cronExpr}`);
  return {
    stop() {
      clearTimeout(boot);
      task.stop();
    },
  };
}