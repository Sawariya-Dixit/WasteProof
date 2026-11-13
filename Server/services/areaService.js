import { Area } from '../models/Area.js';
import { AreaScore } from '../models/AreaScore.js';
import { Site } from '../models/Site.js';
import { Representative } from '../models/Representative.js';
import { AppError } from '../utils/AppError.js';
import { SCORES, VERIFY_THRESHOLD, PUBLIC_SITE_STATUSES } from '../config/defaults.js';
import { simplifyGeometry } from '../utils/areaGeometry.js';

// Score tabhi bahar jata hai jab scoreVisible ho. Counts hamesha jate hain.
function shape(s) {
  const vis = s.scoreVisible;
  return {
    id: s.areaId._id,
    name: s.areaId.name,
    state: s.areaId.state,
    level: s.level,
    isPilot: s.areaId.isPilot ?? false,
    verifiedCount: s.verifiedCount,
    totalCount: s.totalCount,
    scoreVisible: vis,
    overallScore: vis ? s.overallScore : null,
    cityScore: vis ? s.cityScore : null,
    citizenScore: vis ? s.citizenScore : null,
    binScore: vis ? s.binScore : null,
    diagnosis: vis ? s.diagnosis : null,
    insights: vis ? s.insights : [],
    centroid: s.centroid ?? null,
    computedAt: s.computedAt,
  };
}

// Sabse kharab pehle. Jinka score withheld hai wo neeche (verifiedCount zyada wale pehle).
export async function getRanking({ level, limit }) {
  const rows = await AreaScore.find({ level })
    .populate('areaId', 'name state code isPilot')
    .lean();
  const items = rows.filter((r) => r.areaId).map(shape);

  const visible = items
    .filter((a) => a.scoreVisible)
    .sort(
      (a, b) =>
        (a.overallScore ?? 101) - (b.overallScore ?? 101) || a.name.localeCompare(b.name),
    )
    .map((a, i) => ({ ...a, rank: i + 1 }));
  const withheld = items
    .filter((a) => !a.scoreVisible)
    .sort((a, b) => b.verifiedCount - a.verifiedCount || a.name.localeCompare(b.name))
    .map((a) => ({ ...a, rank: null }));

  return [...visible, ...withheld].slice(0, limit);
}

// Areas map ke liye GeoJSON (sirf wo areas jinme sites hain, polygon simplified)
export async function getAreasGeoJSON({ level }) {
  const scores = await AreaScore.find({ level }).lean();
  const areas = await Area.find({ _id: { $in: scores.map((s) => s.areaId) } })
    .select('name geometry')
    .lean();
  const byId = new Map(scores.map((s) => [String(s.areaId), s]));

  const features = areas.map((a) => {
    const s = byId.get(String(a._id));
    return {
      type: 'Feature',
      geometry: simplifyGeometry(a.geometry, SCORES.mapMaxPoints),
      properties: {
        id: String(a._id),
        name: a.name,
        verifiedCount: s.verifiedCount,
        totalCount: s.totalCount,
        scoreVisible: s.scoreVisible,
        overallScore: s.scoreVisible ? s.overallScore : null,
        centroidLng: s.centroid?.[0] ?? null,
        centroidLat: s.centroid?.[1] ?? null,
      },
    };
  });
  return { type: 'FeatureCollection', features };
}

// ---------- Day 16 ----------
const NO_SCORE = {
  verifiedCount: 0,
  totalCount: 0,
  scoreVisible: false,
  overallScore: null,
  cityScore: null,
  citizenScore: null,
  binScore: null,
  diagnosis: null,
  insights: [],
  computedAt: null,
};

// Ek area ka score. Score tabhi jab scoreVisible. Counts hamesha. AreaScore na ho to zero counts.
function scoreOf(s) {
  if (!s) return { ...NO_SCORE, needed: VERIFY_THRESHOLD };
  const vis = s.scoreVisible;
  return {
    verifiedCount: s.verifiedCount,
    totalCount: s.totalCount,
    scoreVisible: vis,
    needed: Math.max(0, VERIFY_THRESHOLD - s.verifiedCount),
    overallScore: vis ? s.overallScore : null,
    cityScore: vis ? s.cityScore : null,
    citizenScore: vis ? s.citizenScore : null,
    binScore: vis ? s.binScore : null,
    diagnosis: vis ? s.diagnosis : null,
    insights: vis ? s.insights : [],
    computedAt: s.computedAt,
  };
}

const siteFilterFor = (area) => {
  const f = { [`areaIds.${area.level}`]: area._id, status: { $in: PUBLIC_SITE_STATUSES } };
  if (!SCORES.includeTest) f.isTest = { $ne: true };
  return f;
};

// GET /areas/:id/score
export async function getAreaScore(id) {
  const area = await Area.findById(id).select('name level').lean();
  if (!area) throw new AppError('Area nahi mili', 404, 'NOT_FOUND');
  const s = await AreaScore.findOne({ areaId: id }).lean();
  return { id: area._id, name: area.name, level: area.level, ...scoreOf(s) };
}

// GET /areas/:id (area ki info + score + top sites + representatives)
export async function getAreaDetail(id) {
  const area = await Area.findById(id).select('name state code level isPilot').lean();
  if (!area) throw new AppError('Area nahi mili', 404, 'NOT_FOUND');

  const [score, topSites, reps] = await Promise.all([
    AreaScore.findOne({ areaId: id }).lean(),
    Site.find(siteFilterFor(area))
      .sort({ backerCount: -1, createdAt: -1 })
      .limit(SCORES.topSites)
      .select('type status backerCount reportCount photoUrls createdAt')
      .lean(),
    Representative.find({ areaId: id }).select('office name').lean(),
  ]);

  return {
    area: {
      id: area._id,
      name: area.name,
      state: area.state,
      level: area.level,
      isPilot: area.isPilot ?? false,
      centroid: score?.centroid ?? null,
    },
    score: scoreOf(score),
    topSites: topSites.map((s) => ({
      id: s._id,
      type: s.type,
      status: s.status,
      backerCount: s.backerCount ?? 0,
      reportCount: s.reportCount ?? 0,
      photoUrl: s.photoUrls?.[0] ?? null,
      createdAt: s.createdAt,
    })),
    representatives: reps.map((r) => ({ office: r.office, name: r.name })),
  };
}

// GET /places?bbox= : "Places pill". Is box me kis assembly area me kitni sites hain.
export async function getPlaces({ bbox, limit }) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const match = {
    status: { $in: PUBLIC_SITE_STATUSES },
    'areaIds.assembly': { $ne: null },
    location: {
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
  if (!SCORES.includeTest) match.isTest = { $ne: true };

  const groups = await Site.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$areaIds.assembly',
        total: { $sum: 1 },
        verified: { $sum: { $cond: [{ $in: ['$status', ['verified', 'cleaned']] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);

  const areas = await Area.find({ _id: { $in: groups.map((g) => g._id) } })
    .select('name state')
    .lean();
  const byId = new Map(areas.map((a) => [String(a._id), a]));

  return groups
    .filter((g) => byId.has(String(g._id)))
    .map((g) => ({
      id: g._id,
      name: byId.get(String(g._id)).name,
      state: byId.get(String(g._id)).state,
      totalCount: g.total,
      verifiedCount: g.verified,
    }));
}