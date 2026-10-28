// Use: node scripts/testResolve.js <lat> <lng>
// Example (Khategaon): node scripts/testResolve.js 22.59 76.91
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Area } from '../models/Area.js';

const lat = Number(process.argv[2]);
const lng = Number(process.argv[3]);
if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
  console.error('Use: node scripts/testResolve.js <lat> <lng>');
  process.exit(1);
}

await connectDB();
const areas = await Area.find({
  geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } }, // [lng, lat]!
})
  .select('level name state code meta')
  .lean();

if (!areas.length) console.log('Is point par koi area nahi mila. Boundaries import ki hain?');
else
  console.table(
    areas.map((a) => ({
      level: a.level,
      name: a.name,
      state: a.state,
      code: a.code,
      meta: JSON.stringify(a.meta),
    })),
  );
await mongoose.connection.close();
