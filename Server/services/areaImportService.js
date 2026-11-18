import { Area } from '../models/Area.js';
import { AdminLog } from '../models/AdminLog.js';
import { parseFeatures } from '../utils/geojsonClean.js';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Representative form ke dropdown ke liye. Geometry kabhi nahi bhejte (bahut bhaari).
export async function searchAreas({ level, q, limit }) {
  const filter = {};
  if (level) filter.level = level;
  if (q) filter.name = new RegExp(esc(q), 'i');
  const rows = await Area.find(filter)
    .sort({ isPilot: -1, level: 1, name: 1 })
    .limit(limit)
    .select('level name state isPilot')
    .lean();
  return rows.map((a) => ({ id: a._id, level: a.level, name: a.name, state: a.state, isPilot: a.isPilot }));
}

// dryRun = sirf file check, DB me kuch nahi likhta
export async function importAreas(adminId, { level, geojson, pilotPoint, dryRun }) {
  const { docs, bad } = parseFeatures(geojson, level);
  const dupCodes = docs.length - new Set(docs.map((d) => d.code)).size;
  const result = {
    dryRun: !!dryRun,
    total: geojson.features.length,
    valid: docs.length,
    invalid: bad.slice(0, 20),
    invalidCount: bad.length,
    duplicateCodes: dupCodes,
    sample: docs[0] ? { name: docs[0].name, state: docs[0].state, code: docs[0].code } : null,
    saved: 0,
    failed: [],
    pilotMarked: 0,
  };
  if (dryRun || !docs.length) return result;

  await Area.init(); // 2dsphere index ban jaye
  for (const d of docs) {
    try {
      // level + code par upsert: dobara import karne par duplicate nahi banta
      await Area.updateOne({ level: d.level, code: d.code }, { $set: d }, { upsert: true });
      result.saved++;
    } catch (e) {
      result.failed.push(`${d.name} (${d.code}): ${e.message}`); // jaise self-intersecting polygon
    }
  }
  result.failed = result.failed.slice(0, 20);

  if (pilotPoint) {
    const r = await Area.updateMany(
      {
        level,
        geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [pilotPoint.lng, pilotPoint.lat] } } },
      },
      { isPilot: true },
    );
    result.pilotMarked = r.modifiedCount;
  }

  await AdminLog.create({
    adminId,
    action: 'areas.import',
    targetType: 'area',
    meta: { level, saved: result.saved, failed: result.failed.length, pilotMarked: result.pilotMarked },
  });
  return result;
}