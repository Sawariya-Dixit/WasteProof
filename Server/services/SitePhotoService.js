import { Site } from '../models/Site.js';
import { env } from '../config/env.js';
import { PUBLIC_SITE_STATUSES } from '../config/defaults.js';
import { AppError } from '../utils/AppError.js';
import { distanceM } from '../utils/geo.js';
import { createReport } from './reportService.js';

// 'Add photo': ek aur photo isi site ke liye. Ye bhi ek Report hai, to poori pipeline chalti hai
// (blur, moderation, duplicate hash, rate limit, judge). Farq: report kisi aur site me merge nahi hoti,
// seedhe isi site me judti hai (targetSiteId) aur type site ka hi hota hai.
export async function addSitePhoto(user, siteId, input, deviceId) {
  const site = await Site.findById(siteId).select('type status location');
  if (!site || site.status === 'hidden') throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (site.status === 'cleaned') throw new AppError('Ye site saaf ho chuki hai', 409, 'SITE_CLOSED');

  // Server khud doori nikaalta hai (vote jaisi hi limit), client par bharosa nahi
  if (input.accuracyM > env.VOTE_MAX_ACCURACY_M) {
    throw new AppError('GPS bahut kamzor hai, khule me jakar try karo', 422, 'GPS_TOO_WEAK', {
      accuracyM: input.accuracyM,
      maxM: env.VOTE_MAX_ACCURACY_M,
    });
  }
  const dist = Math.round(distanceM([input.lng, input.lat], site.location.coordinates));
  if (dist > env.VOTE_MAX_DISTANCE_M) {
    throw new AppError('Aap site se bahut door ho', 422, 'TOO_FAR', {
      distanceM: dist,
      maxM: env.VOTE_MAX_DISTANCE_M,
    });
  }

  return createReport(user, { ...input, type: site.type }, deviceId, { targetSiteId: site._id });
}

// Public: site ki blurred photos ki list
export async function listSitePhotos(siteId) {
  const site = await Site.findOne({ _id: siteId, status: { $in: PUBLIC_SITE_STATUSES } })
    .select('photoUrls')
    .lean();
  if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  return site.photoUrls ?? [];
}