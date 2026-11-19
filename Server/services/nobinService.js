import { NobinZone } from '../models/NobinZone.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { getRedis } from '../config/redis.js';
import { NOBIN, SCORES } from '../config/defaults.js';
import { resolveAreas } from './geoService.js';
import { refreshZoneBin } from './binService.js';
import { withLocks } from './siteMergeService.js';

const EARTH_RADIUS_M = 6378100; // Mongo $centerSphere isi radius par chalta hai
const round = (v) => Number(v.toFixed(NOBIN.roundDecimals));

// Public shape. reporterIds kabhi bahar nahi jaati.
function shapeZone(z) {
  const b = z.nearestBin;
  return {
    id: z._id,
    center: { lat: z.center.coordinates[1], lng: z.center.coordinates[0] },
    radiusM: z.radiusM,
    backerCount: z.backerCount,
    status: z.status,
    nearestBin: b?.checkedAt
      ? { found: !!b.found, name: b.name ?? null, kind: b.kind ?? null, distanceM: b.distanceM ?? null }
      : null, // null = abhi check nahi hua
    createdAt: z.createdAt,
  };
}

// Redis lock ke keys: do paas ki reports ek saath aayein to do zone na banein (3x3 grid, sorted = deadlock nahi)
function lockKeys(lat, lng) {
  const cx = Math.floor(lng / NOBIN.lockCellDeg);
  const cy = Math.floor(lat / NOBIN.lockCellDeg);
  const keys = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) keys.push(`lock:nobin:${cx + dx}:${cy + dy}`);
  }
  return keys.sort();
}

async function areaIdsAt(lat, lng) {
  try {
    const a = await resolveAreas(lat, lng);
    const out = {};
    for (const level of ['ward', 'assembly', 'loksabha', 'district']) if (a[level]) out[level] = a[level].id;
    return out;
  } catch {
    return {}; // areas na mile to zone phir bhi banta hai
  }
}

// GET /nobin-zones?bbox=
export async function listZones({ bbox, limit }) {
  const pad = NOBIN.bboxPadDeg; // zone ka centre box ke thoda bahar ho to bhi uska circle dikhna chahiye
  const [minLng, minLat, maxLng, maxLat] = [bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad];
  const zoneFilter = {
    center: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat],
            ],
          ],
        },
      },
    },
  };
  if (!SCORES.includeTest) zoneFilter.isTest = { $ne: true }; // dummy zones public map par nahi
  const zones = await NobinZone.find(zoneFilter)
    .select('center radiusM backerCount status nearestBin createdAt')
    .limit(limit)
    .lean();
  return zones.map(shapeZone);
}

// POST /nobin-zones: "mere 1 km me dustbin nahi hai". Body = { lat, lng, accuracyM } (khade hone ki jagah)
export async function reportNoBin(user, { lat, lng, accuracyM }) {
  if (accuracyM > NOBIN.maxAccuracyM) {
    throw new AppError('GPS bahut kamzor hai', 422, 'GPS_TOO_WEAK', { maxM: NOBIN.maxAccuracyM });
  }

  // Ek user 500 m ke andar ek hi baar: us jagah ke kisi bhi zone me pehle se ho to dobara nahi
  const already = await NobinZone.exists({
    reporterIds: user._id,
    center: { $geoWithin: { $centerSphere: [[lng, lat], NOBIN.joinM / EARTH_RADIUS_M] } },
  });
  if (already) throw new AppError('Aap is jagah ke paas pehle hi report kar chuke ho', 409, 'ALREADY_REPORTED');

  const point = { type: 'Point', coordinates: [lng, lat] };

  const { zone, joined } = await withLocks(getRedis(), lockKeys(lat, lng), async () => {
    const near = await NobinZone.findOne({
      center: { $nearSphere: { $geometry: point, $maxDistance: NOBIN.joinM } },
    }).select('_id');

    if (near) {
      // Atomic: ek user ek zone me ek hi baar ginta hai
      const updated = await NobinZone.findOneAndUpdate(
        { _id: near._id, reporterIds: { $ne: user._id } },
        { $push: { reporterIds: user._id }, $inc: { backerCount: 1 } },
        { returnDocument: 'after' },
      );
      if (!updated) throw new AppError('Aap is zone me pehle hi ho', 409, 'ALREADY_REPORTED');

      if (updated.status === 'unverified' && updated.backerCount >= NOBIN.verifyAt) {
        await NobinZone.updateOne(
          { _id: updated._id, status: 'unverified' },
          { $set: { status: 'verified', verifiedAt: new Date() } },
        );
        updated.status = 'verified';
      }
      return { zone: updated, joined: true };
    }

    // Nayi zone. Centre round karke save: akele reporter ka asli point public nahi hota
    const rLat = round(lat);
    const rLng = round(lng);
    const created = await NobinZone.create({
      center: { type: 'Point', coordinates: [rLng, rLat] },
      radiusM: NOBIN.radiusM,
      reporterIds: [user._id],
      backerCount: 1,
      areaIds: await areaIdsAt(rLat, rLng),
    });
    return { zone: created, joined: false };
  });

  // OSM check peeche chalta hai, jawab ko rokta nahi, verification ko block nahi karta
  if (!zone.nearestBin?.checkedAt) {
    refreshZoneBin(zone._id, logger).catch((err) => logger.warn({ err: err.message }, 'nearest bin check fail'));
  }

  return { zone: shapeZone(zone), joined };
}