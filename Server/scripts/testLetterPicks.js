// Use: node scripts/testLetterPicks.js <siteId> [issueType]
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Site } from '../models/Site.js';
import { pickAddressees, pickClauses } from '../services/letterService.js';

const [siteId, issueArg] = process.argv.slice(2);
if (!siteId) {
  console.error('Use: node scripts/testLetterPicks.js <siteId> [issueType]');
  process.exit(1);
}

await connectDB();
const site = await Site.findById(siteId).select('type').lean();
if (!site) {
  console.error('Site nahi mili');
  process.exit(1);
}
const issueType = issueArg || site.type;

console.log('issueType:', issueType);
console.log('addressees:', await pickAddressees({ siteId, issueType }));
console.log('clauses:', await pickClauses(issueType));
await mongoose.connection.close();