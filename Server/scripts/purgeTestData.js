// Launch se pehle dummy data hatane ka script.
//
//   npm run purge:test                        -> sirf DEKHO (dry-run): kya kya hatega, ginti
//   npm run purge:test -- --yes               -> sirf seed/test data hatao (isTest:true sites aur zones)
//   npm run purge:test -- --everything --yes  -> CLEAN SLATE: saari sites, reports, votes, notes, letters,
//                                                no-bin zones, scores hatao. Users, areas, representatives,
//                                                rules, local bodies SAFE rehte hain.
//
// Production DB par chalane ke liye server/.env me MONGO_URI prod wali ho (ya MONGO_URI=... npm run ...).
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Site } from '../models/Site.js';
import { Report } from '../models/Report.js';
import { Vote } from '../models/Vote.js';
import { Cleanup } from '../models/Cleanup.js';
import { Note } from '../models/Note.js';
import { PhotoFlag } from '../models/PhotoFlag.js';
import { Letter } from '../models/Letter.js';
import { NobinZone } from '../models/NobinZone.js';
import { AreaScore } from '../models/AreaScore.js';
import { computeAllScores } from '../services/scoreService.js';

const args = new Set(process.argv.slice(2));
const apply = args.has('--yes');
const everything = args.has('--everything');

await connectDB();
console.log(`DB: ${mongoose.connection.name}`);
console.log(everything ? 'Mode: CLEAN SLATE (--everything)' : 'Mode: sirf test/seed data (isTest:true)');
console.log(apply ? 'Action: DELETE chalega\n' : 'Action: DRY-RUN (kuch delete nahi hoga, --yes lagao)\n');

const siteFilter = everything ? {} : { isTest: true };
const zoneFilter = everything ? {} : { isTest: true };
const siteIds = (await Site.find(siteFilter).select('_id').lean()).map((s) => s._id);
const bySite = { siteId: { $in: siteIds } };

// [label, model, filter]. Order: pehle bachhe (votes, notes...), phir sites
const plan = [
  ['reports', Report, everything ? {} : bySite],
  ['votes', Vote, everything ? {} : bySite],
  ['cleanups', Cleanup, everything ? {} : bySite],
  ['notes', Note, everything ? {} : bySite],
  ['photo flags', PhotoFlag, everything ? {} : bySite],
  ['letters', Letter, everything ? {} : bySite],
  ['no-bin zones', NobinZone, zoneFilter],
  ['sites', Site, siteFilter],
];

for (const [label, Model, filter] of plan) {
  const n = await Model.countDocuments(filter);
  if (!apply) {
    console.log(`  ${label.padEnd(14)} ${n} hatenge`);
    continue;
  }
  const res = await Model.deleteMany(filter);
  console.log(`  ${label.padEnd(14)} ${res.deletedCount} hata diye`);
}

if (apply) {
  // Scores sirf derived data hain: sab hatao aur bachi hui (asli) sites se dobara banao
  await AreaScore.deleteMany({});
  await computeAllScores();
  console.log('\nArea scores dobara ban gaye.');
  console.log('Done. Ab site kholo aur hard refresh karo (Ctrl+Shift+R).');
} else {
  console.log('\nDry-run khatam. Theek lage to wahi command --yes ke saath chalao.');
}

await mongoose.connection.close();
process.exit(0);