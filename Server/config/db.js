import mongoose from 'mongoose';

import { env } from '../config/env.js';

import dns from 'node:dns';
import { logger } from '../utils/logger.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDB() {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connected successfully');
}
