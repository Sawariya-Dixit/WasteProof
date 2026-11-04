import { randomUUID } from 'node:crypto';
import { Site } from '../models/Site.js';
import { Cleanup } from '../models/Cleanup.js';
import { env } from '../config/env.js';
import { PLATE_BLUR_PAD } from '../config/defaults.js';
import { AppError } from '../utils/AppError.js';
import { distanceM } from '../utils/geo.js';
import {
  isOwnKey,
  verifyUploadedOriginal,
  downloadOriginal,
  deleteOriginal,
  uploadBlurred,
} from './storageService.js';
import { prepareImage, blurRegions, toNormalized, toPixels } from './blurService.js';
import { detectFaces } from '../ai/faceDetector.js';
import { scanImage } from '../ai/privacyScan.js';
import { judgeFromLabels } from '../ai/visionJudge.js';

// "Site saaf ho gayi" claim, after-photo ke saath.
// After-photo par wahi judge chalta hai: problem 'no' = saaf (accepted), 'yes' = abhi bhi gandi (rejected),
// uncertain ya scan nahi = claimed (admin dekhega). Photo public hone se pehle blur hoti hai.
export async function claimCleanup(user, siteId, { key, lat, lng, accuracyM }) {
  const site = await Site.findById(siteId).select('status type location');
  if (!site || site.status === 'hidden') throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (!['unverified', 'verified'].includes(site.status)) {
    throw new AppError('Ye site pehle hi saaf ho chuki hai', 409, 'SITE_CLOSED');
  }
  if (!isOwnKey(user._id, key)) throw new AppError('Ye photo aapki nahi hai', 403, 'FORBIDDEN_KEY');

  if (accuracyM > env.VOTE_MAX_ACCURACY_M) {
    throw new AppError('GPS bahut kamzor hai, khule me jakar try karo', 422, 'GPS_TOO_WEAK', {
      accuracyM,
      maxM: env.VOTE_MAX_ACCURACY_M,
    });
  }
  const dist = Math.round(distanceM([lng, lat], site.location.coordinates));
  if (dist > env.VOTE_MAX_DISTANCE_M) {
    throw new AppError('Aap site se bahut door ho', 422, 'TOO_FAR', { distanceM: dist, maxM: env.VOTE_MAX_DISTANCE_M });
  }

  await verifyUploadedOriginal(key);
  const raw = await prepareImage(await downloadOriginal(key));

  // Pipeline jaisa hi privacy flow: local faces -> Rekognition -> sab blur
  const localFaces = await detectFaces(raw);
  const preview = await blurRegions(raw, localFaces);
  const scan = await scanImage(preview);
  if (scan.unsafe) {
    await deleteOriginal(key).catch(() => {});
    throw new AppError('Ye photo allowed nahi hai', 422, 'UNSAFE_IMAGE');
  }
  const boxes = [
    ...toNormalized(localFaces, raw.info),
    ...scan.faces,
    ...scan.plates.map((b) => ({ ...b, pad: PLATE_BLUR_PAD })),
  ];
  const jpeg = await blurRegions(raw, toPixels(boxes, raw.info));
  const uploaded = await uploadBlurred(jpeg, `${siteId}-${randomUUID()}`, 'cleanups');

  const verdict = scan.skipped ? null : judgeFromLabels(scan.labels ?? [], site.type).verdict;
  const status = verdict === 'no' ? 'accepted' : verdict === 'yes' ? 'rejected' : 'claimed';

  const cleanup = await Cleanup.create({
    siteId,
    userId: user._id,
    afterPhotoUrl: uploaded.secure_url,
    status,
    check: { verdict: verdict ?? 'unchecked', source: 'labels' },
    distanceM: dist,
  });

  let siteStatus = site.status;
  if (status === 'accepted') {
    await Site.updateOne(
      { _id: siteId, status: { $in: ['unverified', 'verified'] } },
      { $set: { status: 'cleaned', cleanedAt: new Date() } },
    );
    siteStatus = 'cleaned';
  }
  return { cleanup: { id: cleanup._id, status }, site: { id: siteId, status: siteStatus } };
}