import { Site } from '../models/Site.js';
import { Area } from '../models/Area.js';
import { AreaScore } from '../models/AreaScore.js';
import { SCORES, SCORE_LEVELS, BEHAVIOUR_TYPES, VERIFY_THRESHOLD } from '../config/defaults.js';
import { areaKm2, centroidOf } from '../utils/areaGeometry.js';
import { logger } from '../utils/logger.js';

const DAY_MS = 86_400_000;
const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

// density jitni badhe score utna girta hai. badDensity par score 0.
function densityScore(count, km2, badDensity) {
  if (!(km2 > 0)) return null;
  return clamp100(100 * (1 - Math.min(1, count / km2 / badDensity)));
}

function diagnose({ cityScore, citizenScore, binScore, repeatShare }) {
  const low = SCORES.lowScore;
  if (binScore !== null && binScore < low && (citizenScore === null || binScore <= citizenScore)) {
    return 'infrastructure_gap';
  }
  if (cityScore !== null && cityScore < low) return 'city_response';
  if (repeatShare >= SCORES.repeatShare) return 'repeat_spot';
  if (citizenScore !== null && citizenScore < low) return 'behaviour';
  return 'balanced';
}

// Pure function (DB nahi chhuti), isliye test karna aasan hai.
// c = aggregate counts, km2 = area ka size
export function buildScore(c, km2) {
  const visible = c.verified >= VERIFY_THRESHOLD;
  const eligible = c.binOnTime + c.binLate;

  const cityScore =
    eligible >= SCORES.cityMinEligible ? clamp100((100 * c.binOnTime) / eligible) : null;
  const citizenScore = densityScore(c.behaviourVerified, km2, SCORES.citizenBadDensity);
  const binScore = densityScore(c.noBinVerified, km2, SCORES.binBadDensity); // Day 19 me no-bin zones + OSM bin judega

  const parts = [cityScore, citizenScore, binScore].filter((v) => v !== null);
  const overallScore = parts.length
    ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    : null;

  const repeatShare = c.verified ? c.repeatSites / c.verified : 0;
  const diagnosis = visible
    ? diagnose({ cityScore, citizenScore, binScore, repeatShare })
    : null;

  const insights = [];
  if (visible) {
    insights.push({ code: 'verified_sites', params: { verified: c.verified, total: c.total } });
    if (eligible > 0) {
      insights.push({
        code: 'cleanup_rate',
        params: { onTime: c.binOnTime, eligible, days: SCORES.cityCleanupDays },
      });
    }
    if (c.noBinVerified > 0) insights.push({ code: 'no_bin_sites', params: { count: c.noBinVerified } });
    if (c.repeatSites > 0) insights.push({ code: 'repeat_spots', params: { count: c.repeatSites } });
  }

  return { visible, cityScore, citizenScore, binScore, overallScore, diagnosis, insights };
}

// Ek level ke saare areas ki counts, ek hi aggregation me
async function aggregateLevel(level, now) {
  const field = `areaIds.${level}`;
  const match = { status: { $ne: 'hidden' }, [field]: { $ne: null } };
  if (!SCORES.includeTest) match.isTest = { $ne: true };

  // "verified" = 10+ backers wali site (verified ya baad me cleaned)
  const isVer = {
    $and: [{ $in: ['$status', ['verified', 'cleaned']] }, { $gte: ['$backerCount', VERIFY_THRESHOLD] }],
  };
  const isBin = { $eq: ['$type', 'overflowing_bin'] };
  const limitMs = SCORES.cityCleanupDays * DAY_MS;
  const ageMs = { $subtract: [now, '$createdAt'] };
  const cleanMs = { $ifNull: [{ $subtract: ['$cleanedAt', '$createdAt'] }, 1e15] };

  const onTime = {
    $and: [isVer, isBin, { $eq: ['$status', 'cleaned'] }, { $lte: [cleanMs, limitMs] }],
  };
  // late = time nikal chuka aur on-time saaf nahi hui. Jo abhi X din se chhoti hai wo ginti me nahi (history invent nahi)
  const late = { $and: [isVer, isBin, { $not: [onTime] }, { $gt: [ageMs, limitMs] }] };
  const count = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

  return Site.aggregate([
    { $match: match },
    {
      $group: {
        _id: `$${field}`,
        total: { $sum: 1 },
        verified: count(isVer),
        behaviourVerified: count({ $and: [isVer, { $in: ['$type', BEHAVIOUR_TYPES] }] }),
        noBinVerified: count({ $and: [isVer, { $eq: ['$type', 'no_bin'] }] }),
        binOnTime: count(onTime),
        binLate: count(late),
        repeatSites: count({ $and: [isVer, { $gte: ['$reportCount', SCORES.repeatReports] }] }),
      },
    },
  ]);
}

// Area ka size aur centroid ek baar nikalo, Area.meta me cache karo (geometry bhaari hoti hai)
async function ensureAreaStats(ids) {
  const docs = await Area.find({ _id: { $in: ids } })
    .select('meta.areaKm2 meta.centroid')
    .lean();
  const stats = new Map();
  const missing = [];
  for (const d of docs) {
    if (d.meta?.areaKm2 > 0 && d.meta?.centroid) {
      stats.set(String(d._id), { areaKm2: d.meta.areaKm2, centroid: d.meta.centroid });
    } else {
      missing.push(d._id);
    }
  }
  for (const id of missing) {
    const full = await Area.findById(id).select('geometry').lean();
    if (!full) continue;
    const s = {
      areaKm2: Math.round(areaKm2(full.geometry) * 10) / 10,
      centroid: centroidOf(full.geometry),
    };
    await Area.updateOne({ _id: id }, { $set: { 'meta.areaKm2': s.areaKm2, 'meta.centroid': s.centroid } });
    stats.set(String(id), s);
  }
  return stats;
}

export async function computeAllScores({ now = new Date() } = {}) {
  const t0 = Date.now();
  let written = 0;

  for (const level of SCORE_LEVELS) {
    const rows = await aggregateLevel(level, now);
    const stats = await ensureAreaStats(rows.map((r) => r._id));

    const ops = rows.map((r) => {
      const st = stats.get(String(r._id));
      const s = buildScore(r, st?.areaKm2);
      return {
        updateOne: {
          filter: { areaId: r._id },
          update: {
            $set: {
              areaId: r._id,
              level,
              cityScore: s.cityScore,
              citizenScore: s.citizenScore,
              binScore: s.binScore,
              overallScore: s.overallScore,
              verifiedCount: r.verified,
              totalCount: r.total,
              scoreVisible: s.visible,
              diagnosis: s.diagnosis,
              insights: s.insights,
              areaKm2: st?.areaKm2,
              centroid: st?.centroid,
              computedAt: now,
            },
          },
          upsert: true,
        },
      };
    });

    if (ops.length) await AreaScore.bulkWrite(ops);
    // jin areas me ab koi site nahi bachi unka purana score hatao
    await AreaScore.deleteMany({ level, areaId: { $nin: rows.map((r) => r._id) } });
    written += ops.length;
  }

  logger.info({ areas: written, ms: Date.now() - t0 }, 'area scores computed');
  return { areas: written };
}