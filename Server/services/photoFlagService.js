import { Site } from '../models/Site.js';
import { PhotoFlag } from '../models/PhotoFlag.js';
import { AppError } from '../utils/AppError.js';
import {
  PUBLIC_SITE_STATUSES,
  PHOTO_FLAG_HIDE_AT,
  PRIVACY_FLAG_REASONS,
  PHOTO_FLAG_MAX_PER_DAY,
} from '../config/defaults.js';

// Photo ko public list se hatao par DELETE mat karo: quarantinedPhotos me rakho, admin restore kar sakta hai.
// Filter me photoUrls: photoUrl hai, isliye do flag ek saath aayein to bhi photo ek hi baar move hoti hai.
async function quarantine(siteId, photoUrl, reason) {
  const r = await Site.updateOne(
    { _id: siteId, photoUrls: photoUrl },
    {
      $pull: { photoUrls: photoUrl },
      $push: { quarantinedPhotos: { url: photoUrl, reason, at: new Date() } },
    },
  );
  return r.modifiedCount > 0;
}

// Privacy leak (chehra / plate) ka flag 1 par hi photo chhupa deta hai (nuksan wapas nahi hota, isliye pehle chhupao).
// Baaki reasons par PHOTO_FLAG_HIDE_AT ALAG logon ke flag chahiye, aur site ki aakhri photo nahi hatati.
// Griefing roknay ke liye: ek user din me PHOTO_FLAG_MAX_PER_DAY se zyada flag nahi kar sakta.
export async function flagPhoto(user, siteId, { photoUrl, reason }) {
  const site = await Site.findOne({ _id: siteId, status: { $in: PUBLIC_SITE_STATUSES } }).select(
    'photoUrls',
  );
  if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (!site.photoUrls.includes(photoUrl)) {
    throw new AppError('Photo nahi mili', 404, 'PHOTO_NOT_FOUND');
  }

  const today = await PhotoFlag.countDocuments({
    userId: user._id,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (today >= PHOTO_FLAG_MAX_PER_DAY) {
    throw new AppError('Aaj ke liye bahut flags ho gaye, kal try karo', 429, 'TOO_MANY_FLAGS');
  }

  try {
    await PhotoFlag.create({ siteId, userId: user._id, photoUrl, reason });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Aap ye photo pehle flag kar chuke ho', 409, 'ALREADY_FLAGGED');
    }
    throw err;
  }

  const flaggers = (await PhotoFlag.distinct('userId', { siteId, photoUrl })).length;
  const hide =
    PRIVACY_FLAG_REASONS.includes(reason) ||
    (flaggers >= PHOTO_FLAG_HIDE_AT && site.photoUrls.length > 1);

  const removed = hide ? await quarantine(siteId, photoUrl, reason) : false;
  return { flagged: true, removed }; // 'removed' = public se hat gayi (client isi naam se padhta hai)
}

// ADMIN (Day 22-23 me route se jodna): 'dismissed' = flag galat tha, photo wapas; 'upheld' = chhupi rahe
export async function resolveFlag(siteId, photoUrl, decision) {
  if (!['dismissed', 'upheld'].includes(decision)) throw new Error('decision galat hai');
  await PhotoFlag.updateMany({ siteId, photoUrl, status: 'open' }, { $set: { status: decision } });
  if (decision === 'dismissed') {
    await Site.updateOne(
      { _id: siteId, 'quarantinedPhotos.url': photoUrl },
      { $pull: { quarantinedPhotos: { url: photoUrl } }, $addToSet: { photoUrls: photoUrl } },
    );
  }
}