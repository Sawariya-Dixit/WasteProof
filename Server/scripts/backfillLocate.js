// Use: node scripts/backfillLocate.js
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Site } from '../models/Site.js';
import { locateSite } from '../services/locateService.js';

await connectDB();
const sites = await Site.find({ locatedAt: { $exists: false } }).select('_id').lean();
console.log(`${sites.length} sites locate karni hain`);
for (const s of sites) {
  try {
    console.log(await locateSite(s._id, console));
  } catch (err) {
    console.warn(String(s._id), err.message);
  }
}
await mongoose.connection.close();