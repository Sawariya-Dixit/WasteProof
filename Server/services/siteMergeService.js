import { randomUUID } from 'node:crypto';
import { Site } from '../models/Site.js';
import { Vote } from '../models/Vote.js';
import { Report } from '../models/Report.js';
import { getRedis } from '../config/redis.js';
import {
  SITE_MERGE_RADIUS_M,
  SITE_LOCK_CELL_DEG,
  SITE_LOCK_TTL_MS,
  SITE_LOCK_RETRIES,
  SITE_LOCK_RETRY_MS,
  VERIFY_THRESHOLD,
} from '../config/defaults.js';
import { distanceM } from '../utils/geo.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RELEASE = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;

// Photo ke aas-paas ke 3x3 grid cells ke lock keys. Do reports 20 m ke andar hon to
// unke cells overlap karte hain, isliye ek hi site banegi. Sorted = deadlock nahi.
export function lockKeys(type, lat, lng) {
  const cx = Math.floor(lng / SITE_LOCK_CELL_DEG);
  const cy = Math.floor(lat / SITE_LOCK_CELL_DEG);
  const keys = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) keys.push(`lock:site:${type}:${cx + dx}:${cy + dy}`);
  }
  return keys.sort();
}

// Saare keys ek saath lo (SET NX), kaam karo, chhodo. Na mile to thodi der baad dobara.
export async function withLocks(
  redis,
  keys,
  fn,
  { retries = SITE_LOCK_RETRIES, retryMs = SITE_LOCK_RETRY_MS } = {},
) {
  const token = randomUUID();
  const release = (list) =>
    Promise.all(list.map((k) => redis.eval(RELEASE, 1, k, token).catch(() => {})));

  for (let attempt = 0; attempt < retries; attempt++) {
    const got = [];
    for (const k of keys) {
      const ok = await redis.set(k, token, 'PX', SITE_LOCK_TTL_MS, 'NX');
      if (ok !== 'OK') break;
      got.push(k);
    }
    if (got.length === keys.length) {
      try {
        return await fn();
      } finally {
        await release(got);
      }
    }
    await release(got);
    await sleep(retryMs + Math.random() * 100);
  }
  throw new Error('Site lock nahi mila, job retry hoga');
}

// Report ko 20 m ke andar ki site me jodo, ya nayi site banao. Idempotent: siteId pehle se ho to wahi.
export async function attachReportToSite(reportId, redis = getRedis()) {
  const report = await Report.findById(reportId).select('userId type location blurredUrl siteId');
  if (!report) throw new Error('Report nahi mili');
  if (report.siteId) return { siteId: report.siteId, joined: true, distanceM: null };

  const coords = report.location.coordinates; // [lng, lat]
  const point = { type: 'Point', coordinates: coords };
  const url = report.blurredUrl;

  return withLocks(redis, lockKeys(report.type, coords[1], coords[0]), async () => {
    // Hidden aur cleaned site se nahi jodte (cleaned ke baad naya dher nayi site hai)
    const near = await Site.findOne({
      type: report.type,
      status: { $in: ['unverified', 'verified'] },
      location: { $near: { $geometry: point, $maxDistance: SITE_MERGE_RADIUS_M } },
    }).select('location');

    let siteId;
    let dist = 0;
    if (near) {
      siteId = near._id;
      dist = Math.round(distanceM(coords, near.location.coordinates));
      await Site.updateOne(
        { _id: siteId },
        {
          $inc: { reportCount: 1 },
          ...(url ? { $push: { photoUrls: { $each: [url], $slice: -20 } } } : {}),
        },
      );
      // Ek user ek hi baar backer ginta hai
      await Site.updateOne(
        { _id: siteId, backers: { $ne: report.userId } },
        { $addToSet: { backers: report.userId }, $inc: { backerCount: 1 } },
      );
    } else {
      const site = await Site.create({
        type: report.type,
        location: point,
        backers: [report.userId],
        backerCount: 1,
        reportCount: 1,
        photoUrls: url ? [url] : [],
        firstReportId: report._id,
      });
      siteId = site._id;
    }

    // Reporter ka 'yes' vote: unique index baad me use dobara vote nahi karne dega
    await Vote.updateOne(
      { siteId, userId: report.userId },
      { $setOnInsert: { value: 'yes', distanceM: dist } },
      { upsert: true },
    );
    await Report.updateOne({ _id: report._id }, { $set: { siteId } });
    // 10 distinct backers = verified (sirf log karte hain, model nahi)
    await Site.updateOne(
      { _id: siteId, status: 'unverified', backerCount: { $gte: VERIFY_THRESHOLD } },
      { $set: { status: 'verified' } },
    );
    return { siteId, joined: !!near, distanceM: dist };
  });
}