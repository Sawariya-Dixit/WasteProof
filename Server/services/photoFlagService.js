import { Site } from '../models/Site.js';
import { PhotoFlag } from '../models/PhotoFlag.js';
import { AppError } from '../utils/AppError.js';
import {
  PUBLIC_SITE_STATUSES,
  PHOTO_FLAG_HIDE_AT,
  PRIVACY_FLAG_REASONS,
} from '../config/defaults.js';

// Privacy leak (chehra / plate) ka flag 1 par hi photo hata deta hai. Baaki reasons par PHOTO_FLAG_HIDE_AT
// alag logon ke flag chahiye, aur site ki aakhri photo nahi hatati.
export async function flagPhoto(user, siteId, { photoUrl, reason }) {
  const site = await Site.findOne({ _id: siteId, status: { $in: PUBLIC_SITE_STATUSES } }).select('photoUrls');
  if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (!site.photoUrls.includes(photoUrl)) throw new AppError('Photo nahi mili', 404, 'PHOTO_NOT_FOUND');

  try {
    await PhotoFlag.create({ siteId, userId: user._id, photoUrl, reason });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Aap ye photo pehle flag kar chuke ho', 409, 'ALREADY_FLAGGED');
    throw err;
  }

  const count = await PhotoFlag.countDocuments({ siteId, photoUrl });
  const hide =
    PRIVACY_FLAG_REASONS.includes(reason) || (count >= PHOTO_FLAG_HIDE_AT && site.photoUrls.length > 1);
  let removed = false;
  if (hide) {
    const r = await Site.updateOne({ _id: siteId }, { $pull: { photoUrls: photoUrl } });
    removed = r.modifiedCount > 0;
  }
  return { flagged: true, removed };
}