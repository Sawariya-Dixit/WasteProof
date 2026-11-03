import { Site } from '../models/Site.js';
import { Vote } from '../models/Vote.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { distanceM } from '../utils/geo.js';
import { VERIFY_THRESHOLD, HIDE_NO_MARGIN } from '../config/defaults.js';

// value: 'yes' (confirm) | 'me_too' (mujhe bhi yahi dikha) | 'no' (yahan nahi hai)
// Server khud doori nikaalta hai. Client par bharosa nahi.
export async function castVote(user, siteId, { value, lat, lng, accuracyM }) {
  const site = await Site.findById(siteId).select('status location');
  if (!site || site.status === 'hidden') throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (site.status === 'cleaned') {
    throw new AppError('Ye site saaf ho chuki hai', 409, 'SITE_CLOSED');
  }

  if (accuracyM > env.VOTE_MAX_ACCURACY_M) {
    throw new AppError('GPS bahut kamzor hai, khule me jakar try karo', 422, 'GPS_TOO_WEAK', {
      accuracyM,
      maxM: env.VOTE_MAX_ACCURACY_M,
    });
  }
  const dist = Math.round(distanceM([lng, lat], site.location.coordinates));
  if (dist > env.VOTE_MAX_DISTANCE_M) {
    throw new AppError('Aap site se bahut door ho', 422, 'TOO_FAR', {
      distanceM: dist,
      maxM: env.VOTE_MAX_DISTANCE_M,
    });
  }

  // 1) Vote likho. Unique index (siteId, userId) ek user ek vote pakka karta hai.
  //    Pehli report wale ka 'yes' vote merge ke time hi ban chuka hota hai, wo dobara vote nahi kar sakta.
  try {
    await Vote.create({ siteId, userId: user._id, value, distanceM: dist });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Aap vote de chuke ho', 409, 'ALREADY_VOTED');
    throw err;
  }

  // 2) Site ke counters. Fail ho to vote wapas hatao, taaki user dobara vote kar sake.
  try {
    await applyVoteToSite(siteId, user._id, value);
  } catch (err) {
    await Vote.deleteOne({ siteId, userId: user._id }).catch(() => {});
    throw err;
  }

  const fresh = await Site.findById(siteId).select('status backerCount noCount').lean();
  return {
    vote: { value, distanceM: dist },
    site: { id: siteId, status: fresh.status, backerCount: fresh.backerCount, noCount: fresh.noCount },
  };
}

async function applyVoteToSite(siteId, userId, value) {
  if (value === 'no') {
    await Site.updateOne({ _id: siteId }, { $inc: { noCount: 1 } });
    // 'no' votes backers se HIDE_NO_MARGIN ya zyada aage nikal jayein to site hide
    await Site.updateOne(
      {
        _id: siteId,
        status: { $in: ['unverified', 'verified'] },
        $expr: { $gte: [{ $subtract: ['$noCount', '$backerCount'] }, HIDE_NO_MARGIN] },
      },
      { $set: { status: 'hidden' } },
    );
    return;
  }
  // yes / me_too dono backer ginte hain. $ne filter se ek user do baar nahi ginta.
  await Site.updateOne(
    { _id: siteId, backers: { $ne: userId } },
    { $addToSet: { backers: userId }, $inc: { backerCount: 1 } },
  );
  // 10 alag log = verified (sirf log karte hain, model nahi)
  await Site.updateOne(
    { _id: siteId, status: 'unverified', backerCount: { $gte: VERIFY_THRESHOLD } },
    { $set: { status: 'verified' } },
  );
}