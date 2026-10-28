// Use:
//   node scripts/importGeoJSON.js <file.geojson> --level=assembly|loksabha|district [--pilot-point=22.59,76.91] [--dry]
//
// --dry = sirf file check karo, database ko haath nahi lagana (Mongo ya .env ki zaroorat nahi).
// Dobara chalane par duplicate nahi banta (level + code par upsert).
import fs from 'node:fs';

// DataMeet files ke field names (asli files se verify kiye hue)
const PRESETS = {
  assembly: { name: 'AC_NAME', no: 'AC_NO', state: 'ST_NAME', meta: ['DIST_NAME', 'PC_NAME'] },
  loksabha: { name: 'pc_name', no: 'pc_no', state: 'st_name', meta: ['pc_category'] },
  district: { name: 'DISTRICT', no: 'censuscode', state: 'ST_NM', meta: [] },
};

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const level = opt('level');
const dry = args.includes('--dry');
const pilotPoint = (opt('pilot-point') || '').split(',').map(Number); // lat,lng
const hasPilot = pilotPoint.length === 2 && pilotPoint.every(Number.isFinite);

if (!file || !PRESETS[level]) {
  console.error(
    'Use: node scripts/importGeoJSON.js <file.geojson> --level=assembly|loksabha|district [--pilot-point=lat,lng] [--dry]',
  );
  process.exit(1);
}
const preset = PRESETS[level];

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const tidy = (s) => {
  const t = String(s).trim().replace(/\s+/g, ' ');
  // "MADHYA PRADESH" -> "Madhya Pradesh" (sirf tab jab pura CAPS ho). "(SC)" jaisa suffix waisa hi rehta hai.
  return t === t.toUpperCase()
    ? t
        .toLowerCase()
        .replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase())
        .replace(/\((sc|st)\)/gi, (m) => m.toUpperCase())
    : t;
};

// Geometry saaf karo: sirf 2D, lagatar duplicate points hatao, ring band ho, kam se kam 4 points
function cleanRing(ring) {
  const out = [];
  for (const p of ring) {
    const pt = [p[0], p[1]];
    const last = out[out.length - 1];
    if (!last || last[0] !== pt[0] || last[1] !== pt[1]) out.push(pt);
  }
  const f = out[0],
    l = out[out.length - 1];
  if (f && (f[0] !== l[0] || f[1] !== l[1])) out.push([...f]);
  return out;
}
function cleanGeometry(g) {
  if (!g || !['Polygon', 'MultiPolygon'].includes(g.type))
    throw new Error(`geometry ${g?.type ?? 'missing'} chalega nahi (Polygon/MultiPolygon chahiye)`);
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const cleaned = polys
    .map((rings) => rings.map(cleanRing).filter((r) => r.length >= 4))
    .filter((rings) => rings.length > 0);
  if (!cleaned.length) throw new Error('geometry khali ya bahut chhoti hai');
  const [x, y] = cleaned[0][0][0];
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    throw new Error(
      'coordinates lat/lng nahi lag rahe (projected CRS?). mapshaper me `-proj wgs84` lagao',
    );
  }
  return cleaned.length === 1 && g.type === 'Polygon'
    ? { type: 'Polygon', coordinates: cleaned[0] }
    : { type: 'MultiPolygon', coordinates: cleaned };
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (data.type !== 'FeatureCollection') {
  console.error('FeatureCollection chahiye');
  process.exit(1);
}

const docs = [];
const bad = [];
for (const [i, f] of data.features.entries()) {
  const p = f.properties || {};
  try {
    if (p[preset.name] == null || p[preset.no] == null || p[preset.state] == null) {
      throw new Error(
        `properties me ${preset.name}/${preset.no}/${preset.state} chahiye. Mili: ${Object.keys(p).join(', ')}`,
      );
    }
    const state = tidy(p[preset.state]);
    docs.push({
      level,
      name: tidy(p[preset.name]),
      state,
      code: `${slug(state)}-${p[preset.no]}`,
      geometry: cleanGeometry(f.geometry),
      isPilot: false,
      meta: Object.fromEntries(
        preset.meta.filter((k) => p[k] != null && p[k] !== '').map((k) => [k, tidy(p[k])]),
      ),
    });
  } catch (e) {
    bad.push(`feature #${i}: ${e.message}`);
  }
}

console.log(
  `${file}: ${data.features.length} features, ${docs.length} theek, ${bad.length} kharab`,
);
bad.slice(0, 10).forEach((b) => console.log('  -', b));
const dupCodes = docs.length - new Set(docs.map((d) => d.code)).size;
if (dupCodes)
  console.log(
    `  ! ${dupCodes} duplicate code mile (ek hi code ki do features). Upsert me aakhri jeetegi.`,
  );
console.log('  sample:', JSON.stringify({ ...docs[0], geometry: docs[0]?.geometry.type }));

if (dry) {
  console.log('--dry: database me kuch nahi likha.');
  process.exit(bad.length ? 1 : 0);
}

const { default: mongoose } = await import('mongoose');
const { connectDB } = await import('../config/db.js');
const { Area } = await import('../models/Area.js');

await connectDB();
await Area.init(); // 2dsphere index ban jaye
let ok = 0;
const failed = [];
for (const d of docs) {
  try {
    await Area.updateOne({ level: d.level, code: d.code }, { $set: d }, { upsert: true });
    ok++;
  } catch (e) {
    failed.push(`${d.name} (${d.code}): ${e.message}`); // jaise: self-intersecting polygon
  }
}
console.log(`Import: ${ok} save hui, ${failed.length} fail.`);
failed.slice(0, 10).forEach((f) => console.log('  -', f));
if (failed.length)
  console.log(
    'Fail hui features ko mapshaper.org me "Repair intersections" se theek karke dobara chalao.',
  );
if (hasPilot) {
  const [plat, plng] = pilotPoint;
  const r = await Area.updateMany(
    {
      level,
      geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [plng, plat] } } },
    },
    { isPilot: true },
  );
  console.log(`Pilot flag: ${r.modifiedCount} ${level} area(s) (point ${plat},${plng})`);
}
console.log(`Total ${level} areas DB me:`, await Area.countDocuments({ level }));
await mongoose.connection.close();
process.exit(failed.length || bad.length ? 1 : 0);
