// Use: npm run seed:test   (phir: npm run scores)
// Sab sites isTest:true ke saath. Production se pehle: Site.deleteMany({ isTest: true })
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Site } from '../models/Site.js';
import { resolveAreas } from '../services/geoService.js';

const DAY = 86_400_000;
const now = Date.now();

// Seed fix hai, isliye har baar same data banta hai
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(15);
const between = ([a, b]) => a + Math.floor(rand() * (b - a + 1));
const jitter = ([lng, lat], spread) => [lng + (rand() - 0.5) * spread, lat + (rand() - 0.5) * spread];

const DEFAULT_BACKERS = { verified: [10, 14], cleaned: [10, 13], unverified: [1, 8] };

// n sites, status, aur optional: backers, ageDays, cleanedAfterDays, reports
const KHATEGAON = [
  { type: 'waste_dump', status: 'verified', n: 5, ageDays: [10, 40], reports: [1, 3] },
  { type: 'waste_dump', status: 'verified', n: 2, ageDays: [30, 60], reports: [6, 9] }, // repeat spots
  { type: 'waste_dump', status: 'cleaned', n: 1, ageDays: [15, 30], cleanedAfterDays: [2, 3] },
  { type: 'waste_dump', status: 'unverified', n: 3, ageDays: [1, 6] },
  { type: 'contaminated_water', status: 'verified', n: 2, ageDays: [8, 30] },
  { type: 'open_construction', status: 'verified', n: 1, ageDays: [8, 30] },
  { type: 'no_bin', status: 'verified', n: 3, ageDays: [8, 30] },
  { type: 'no_bin', status: 'unverified', n: 2, ageDays: [1, 6] },
  // overflowing bins (city response): 3 on time, 1 late, 1 purani abhi tak gandi, 1 abhi nayi (ginti me nahi)
  { type: 'overflowing_bin', status: 'cleaned', n: 3, ageDays: [15, 30], cleanedAfterDays: [1, 4] },
  { type: 'overflowing_bin', status: 'cleaned', n: 1, ageDays: [25, 30], cleanedAfterDays: [12, 14] },
  { type: 'overflowing_bin', status: 'verified', n: 1, ageDays: [20, 25] },
  { type: 'overflowing_bin', status: 'verified', n: 1, ageDays: [1, 2] },
  { type: 'overflowing_bin', status: 'unverified', n: 1, ageDays: [1, 3] },
];

// Dewas shehar: sirf 3 verified, to score "withheld" dikhna chahiye
const DEWAS = [
  { type: 'waste_dump', status: 'verified', n: 3, ageDays: [5, 20] },
  { type: 'waste_dump', status: 'unverified', n: 3, ageDays: [1, 5] },
];

// Ujjain: no-bin zyada, to infrastructure_gap jaisa kuch dikhna chahiye
const UJJAIN = [
  { type: 'no_bin', status: 'verified', n: 8, ageDays: [5, 30] },
  { type: 'waste_dump', status: 'verified', n: 4, ageDays: [5, 30] },
  { type: 'waste_dump', status: 'unverified', n: 2, ageDays: [1, 5] },
];

const PLACES = [
  { name: 'Khategaon', center: [76.9132, 22.5933], spread: 0.012, plan: KHATEGAON },
  { name: 'Dewas', center: [76.0553, 22.9659], spread: 0.01, plan: DEWAS },
  { name: 'Ujjain', center: [75.7849, 23.1765], spread: 0.01, plan: UJJAIN },
];

async function buildDocs(place) {
  const docs = [];
  for (const p of place.plan) {
    for (let i = 0; i < p.n; i++) {
      const [lng, lat] = jitter(place.center, place.spread);
      const found = await resolveAreas(lat, lng);
      const areaIds = {};
      for (const level of ['ward', 'assembly', 'loksabha', 'district']) {
        if (found[level]) areaIds[level] = found[level].id;
      }
      if (!areaIds.assembly) console.warn(`  ! ${place.name}: assembly nahi mili (importGeoJSON chala?)`);

      const createdAt = new Date(now - between(p.ageDays ?? [1, 10]) * DAY);
      const doc = {
        type: p.type,
        status: p.status,
        location: { type: 'Point', coordinates: [lng, lat] },
        backerCount: between(p.backers ?? DEFAULT_BACKERS[p.status]),
        noCount: p.status === 'unverified' ? between([0, 2]) : 0,
        reportCount: between(p.reports ?? [1, 3]),
        areaIds,
        isTest: true,
        _createdAt: createdAt,
      };
      if (p.status === 'cleaned') {
        doc.cleanedAt = new Date(createdAt.getTime() + between(p.cleanedAfterDays ?? [1, 4]) * DAY);
      }
      docs.push(doc);
    }
  }
  return docs;
}

await connectDB();
await Site.init();
const removed = await Site.deleteMany({ isTest: true });
console.log(`${removed.deletedCount} purani test sites hataayi`);

const all = [];
for (const place of PLACES) {
  const docs = await buildDocs(place);
  console.log(`${place.name}: ${docs.length} sites`);
  all.push(...docs);
}

const inserted = await Site.insertMany(all.map(({ _createdAt, ...d }) => d));
// createdAt purani date par karo (timestamps band karke, warna Mongoose aaj ki date laga deta hai)
// createdAt Mongoose me immutable hai, isliye native driver se likho (casting bypass)
await Site.collection.bulkWrite(
  inserted.map((s, i) => ({
    updateOne: { filter: { _id: s._id }, update: { $set: { createdAt: all[i]._createdAt } } },
  })),
);

console.log(`Total ${inserted.length} test sites ban gayi. Ab chalao: npm run scores`);
await mongoose.connection.close();