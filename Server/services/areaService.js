import { Area } from '../models/Area.js';
import { AreaScore } from '../models/AreaScore.js';
import { SCORES } from '../config/defaults.js';
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