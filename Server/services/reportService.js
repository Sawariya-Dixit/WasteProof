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
const summarize = (r) => ({
  id: r._id,
  type: r.type,
  status: r.status,
  siteId: r.siteId ?? null,
  blurredUrl: r.blurredUrl ?? null,
  note: r.note ?? null,
  capturedAt: r.capturedAt,
  createdAt: r.createdAt,
  rejectReason: r.pipeline?.rejectReason ?? null,
});
//Kitne steps ho chuke (Activity page ka "x of 6")
const progressOf = (r) => {
  const steps = r.pipeline?.steps ?? {};
  return {
    done: PIPELINE_STEP_NAMES.filter((n) => steps[n]?.done).length,
    total: PIPELINE_STEP_NAMES.length,
  };
};

export async function listMyReports(userId, { page, limit }) {
  const filter = { userId };
  const [rows, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('type status siteId blurredUrl note capturedAt createdAt pipeline')
      .lean(),
    Report.countDocuments(filter),
  ]);
  return { reports: rows.map((r) => ({ ...summarize(r), progress: progressOf(r) })), total };
}

// Sirf owner dekh sakta hai. Dusre ki report par bhi 404, taaki pata na chale ki wo exist karti hai
export async function getMyReport(userId, id) {
  const r = await Report.findOne({ _id: id, userId }).lean(); // originalKey select:false hai, bahar nahi jaati
  if (!r) throw new AppError('Report nahi mili', 404, 'NOT_FOUND');

  const steps = r.pipeline?.steps ?? {};
  return {
    ...summarize(r),
    progress: progressOf(r),
    accuracyM: r.accuracyM ?? null,
    location: { lat: r.location.coordinates[1], lng: r.location.coordinates[0] },
    checks: PIPELINE_STEP_NAMES.map((name) => ({
      name,
      done: !!steps[name]?.done,
      at: steps[name]?.at ?? null,
    })),
    facesBlurred: steps.blur?.result?.faces ?? null,
    platesBlurred: steps.blur?.result?.plates ?? null,
    failed: r.status === 'needs_review',
  };
}