import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Sirf local development me: kuch networks (hotspot, ISP, VPN) Atlas ke SRV/TXT lookup refuse karte hain.
// Deploy par (Render/Railway) iski zaroorat nahi, wahan system DNS theek hota hai.
if (env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

export async function connectDB() {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connected successfully');
}