import { Report } from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { isOwnKey, verifyUploadedOriginal } from './storageService.js';
import { REPORT_MAX_AGE_MS, CLOCK_SKEW_MS, SNAPS_PER_HOUR } from '../config/defaults.js';
import { enqueueReport } from '../queues/reportQueue.js';
import { logger } from '../utils/logger.js';

export async function createReport(user, input) {
  const { key, sha256, lat, lng, accuracyM, capturedAt, type, note } = input;

  // 1) Key isi user ke folder ki honi chahiye
  if (!isOwnKey(user._id, key)) {
    throw new AppError('Ye photo aapki nahi hai', 403, 'FORBIDDEN_KEY');
  }

  // 2) Fresh timestamp: server ki ghadi hi sach hai
  const now = Date.now();
  const t = capturedAt.getTime();
  if (t > now + CLOCK_SKEW_MS) {
    throw new AppError('Photo ka time future ka hai', 422, 'BAD_TIME');
  }
  if (now - t > REPORT_MAX_AGE_MS) {
    throw new AppError('Photo purani hai, nayi photo lo', 422, 'STALE_PHOTO');
  }

  // 3) Per-user rate limit
  const recent = await Report.countDocuments({
    userId: user._id,
    createdAt: { $gte: new Date(now - 60 * 60 * 1000) },
  });
  if (recent >= SNAPS_PER_HOUR) {
    throw new AppError(
      'Ghante me bahut reports ho gayi, thodi der baad try karo',
      429,
      'RATE_LIMIT',
    );
  }

  // 4) Duplicate: same hash ya same upload key
  const dup = await Report.exists({ $or: [{ sha256 }, { originalKey: key }] });
  if (dup) throw new AppError('Ye photo pehle hi report ho chuki hai', 409, 'DUPLICATE_IMAGE');

  // 5) Cloudinary par file sach me hai, size/format theek hai (sabse mehnga check, last me)
  await verifyUploadedOriginal(key);

  // 6) Save (status = pending)
  try {
    const report = await Report.create({
      userId: user._id,
      type,
      originalKey: key,
      sha256,
      location: { type: 'Point', coordinates: [lng, lat] }, // [lng, lat]!
      accuracyM,
      capturedAt,
      note,
    });

    // TODO Day 6: yahan BullMQ queue me job daalna hai (jobId = report._id)
    // Report DB me save ho chuki hai. Ab queue me daalo.
    // Queue fail ho to bhi user ko 202 do. Report pending rahegi, baad me requeue kar sakte hain.
    try {
      await enqueueReport(report._id);
    } catch (err) {
      logger.error(
        { err, reportId: String(report._id) },
        'Enqueue failed, report pending hi rahegi',
      );
    }

    return report;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Ye photo pehle hi report ho chuki hai', 409, 'DUPLICATE_IMAGE');
    }
    throw err;
  }
}
