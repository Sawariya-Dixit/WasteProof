import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// BullMQ ke liye maxRetriesPerRequest: null zaroori hai
export function createRedis(name = 'redis') {
  const conn = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  conn.on('connect', () => logger.info(`${name} connected`));
  conn.on('error', (err) => logger.error({ err }, `${name} error`));
  return conn;
}

// API process me ek hi shared connection (queue + Day 10 ka lock)
let shared;
export function getRedis() {
  if (!shared) shared = createRedis('redis(api)');
  return shared;
}

export async function closeRedis() {
  if (shared) {
    await shared.quit();
    shared = undefined;
  }
}
