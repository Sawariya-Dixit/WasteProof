import { createHash, randomUUID } from 'node:crypto';
import { Site } from '../models/Site.js';
import { Cleanup } from '../models/Cleanup.js';
import {
  PLATE_BLUR_PAD,
  CLEANUP_MAX_DISTANCE_M,
  CLEANUP_MAX_ACCURACY_M,
  CLEANUP_ACCEPT_AT,
  CLEANUP_WINDOW_DAYS,
} from '../config/defaults.js';
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
// Ek akeli claim site band NAHI karti (warna koi bhi kisi saaf jagah ki photo se asli dump mita sakta tha).
//   1) site ke bahut paas (CLEANUP_MAX_DISTANCE_M) aur achhi GPS accuracy chahiye
//   2) ek user ek site par ek hi chalti claim; same photo (sha256) dobara nahi
//   3) judge 'no problem' bole to claim 'accepted' hoti hai, site tab 'cleaned' jab
//      CLEANUP_ACCEPT_AT alag users ki accepted claims ho (CLEANUP_WINDOW_DAYS ke andar)
//   4) judge 'yes' = abhi gandi (rejected), uncertain = claimed (admin dekhega)
export async function claimCleanup(user, siteId, { key, lat, lng, accuracyM }) {
  const site = await Site.findById(siteId).select('status type location');
  if (!site || site.status === 'hidden') throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (!['unverified', 'verified'].includes(site.status)) {
    throw new AppError('Ye site pehle hi saaf ho chuki hai', 409, 'SITE_CLOSED');
  }
  if (!isOwnKey(user._id, key)) throw new AppError('Ye photo aapki nahi hai', 403, 'FORBIDDEN_KEY');

  if (accuracyM > CLEANUP_MAX_ACCURACY_M) {
    throw new AppError('GPS bahut kamzor hai, khule me jakar try karo', 422, 'GPS_TOO_WEAK', {
      accuracyM,
      maxM: CLEANUP_MAX_ACCURACY_M,
    });
  }
  const dist = Math.round(distanceM([lng, lat], site.location.coordinates));
  if (dist > CLEANUP_MAX_DISTANCE_M) {
    throw new AppError('Aap site se bahut door ho', 422, 'TOO_FAR', {
      distanceM: dist,
      maxM: CLEANUP_MAX_DISTANCE_M,
    });
  }

  // Mehnga kaam shuru karne se pehle: is user ki is site par pehle se chalti claim?
  const mine = await Cleanup.exists({
    siteId,
    userId: user._id,
    status: { $in: ['claimed', 'accepted'] },
  });
  if (mine) throw new AppError('Aap pehle hi claim bhej chuke ho', 409, 'ALREADY_CLAIMED');

  await verifyUploadedOriginal(key);
  const original = await downloadOriginal(key);

  // Server khud hash nikaale. Pehle use hui after-photo dobara nahi chalegi
  const sha256 = createHash('sha256').update(original).digest('hex');
  if (await Cleanup.exists({ sha256 })) {
    await deleteOriginal(key).catch(() => {});
    throw new AppError('Ye photo pehle use ho chuki hai', 409, 'DUPLICATE_IMAGE');
  }

  const raw = await prepareImage(original);

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

  // Blurred copy ban gayi, unblurred original ab zaroori nahi: privacy ke liye turant hata do
  await deleteOriginal(key).catch(() => {});

  const verdict = scan.skipped ? null : judgeFromLabels(scan.labels ?? [], site.type).verdict;
  const status = verdict === 'no' ? 'accepted' : verdict === 'yes' ? 'rejected' : 'claimed';

  let cleanup;
  try {
    cleanup = await Cleanup.create({
      siteId,
      userId: user._id,
      afterPhotoUrl: uploaded.secure_url,
      status,
      sha256,
      check: { verdict: verdict ?? 'unchecked', source: 'labels' },
      distanceM: dist,
    });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Ye photo pehle use ho chuki hai', 409, 'DUPLICATE_IMAGE');
    throw err;
  }

  // Site tabhi 'cleaned' jab alag-alag CLEANUP_ACCEPT_AT users ki accepted claims ho
  let siteStatus = site.status;
  let accepted = 0;
  if (status === 'accepted') {
    const since = new Date(Date.now() - CLEANUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const users = await Cleanup.distinct('userId', {
      siteId,
      status: 'accepted',
      createdAt: { $gte: since },
    });
    accepted = users.length;
    if (accepted >= CLEANUP_ACCEPT_AT) {
      await Site.updateOne(
        { _id: siteId, status: { $in: ['unverified', 'verified'] } },
        { $set: { status: 'cleaned', cleanedAt: new Date() } },
      );
      siteStatus = 'cleaned';
    }
  }
  return {
    cleanup: { id: cleanup._id, status },
    site: { id: siteId, status: siteStatus },
    progress: { accepted, needed: CLEANUP_ACCEPT_AT },
  };
}