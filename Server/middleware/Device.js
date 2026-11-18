import crypto from 'node:crypto';
import { Device } from '../models/Device.js';
import { Report } from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const hashDeviceId = (id) =>
  crypto.createHash('sha256').update(`${env.DEVICE_SALT}:${id.toLowerCase()}`).digest('hex');

// protect ke BAAD lagao. Production me header zaroori, dev me na ho to bina device ke chalne deta hai.
export async function deviceGuard(req, res, next) {
  const raw = req.get('x-device-id');
  if (!raw || !UUID.test(raw)) {
    if (env.NODE_ENV === 'production') throw new AppError('Device id zaroori hai', 400, 'DEVICE_REQUIRED');
    return next();
  }

  const device = await Device.findOneAndUpdate(
    { fingerprintHash: hashDeviceId(raw) },
    { $set: { userId: req.user._id, lastSeenAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
  if (device.blocked) throw new AppError('Ye device block hai', 403, 'DEVICE_BLOCKED');

  const recent = await Report.countDocuments({
    deviceId: device._id,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent >= env.DEVICE_SNAPS_PER_HOUR) {
    throw new AppError('Is phone se ghante me bahut reports ho gayi', 429, 'RATE_LIMIT');
  }
  req.deviceId = device._id;
  next();
}