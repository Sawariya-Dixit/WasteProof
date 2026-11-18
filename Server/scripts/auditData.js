// Use: npm run audit:data
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Area } from '../models/Area.js';
import { Representative } from '../models/Representative.js';
import { LocalBody } from '../models/LocalBody.js';
import { RuleText } from '../models/RuleText.js';

const PILOT = { name: 'Khategaon', point: [76.9132, 22.5933] }; // [lng, lat]
const rows = [];
const OK = '✅', WARN = '⚠️ ', BAD = '❌';
const add = (level, check, detail = '') => rows.push({ '': level, check, detail });
const norm = (s) => String(s ?? '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');

await connectDB();

// 1) Pilot point kin areas me aata hai
const at = async (level) =>
  Area.findOne({ level, geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: PILOT.point } } } })
    .select('name code isPilot meta')
    .lean();
const [ac, pc, dist] = await Promise.all([at('assembly'), at('loksabha'), at('district')]);

for (const [lvl, a] of [['assembly', ac], ['loksabha', pc], ['district', dist]]) {
  add(a ? OK : BAD, `${PILOT.name} point -> ${lvl}`, a ? `${a.name}${a.isPilot ? '' : ' (isPilot false)'}` : 'nahi mila');
}

// 2) Assembly file ka PC_NAME aur Lok Sabha polygon ek hi seat batate hain?
if (ac && pc) {
  const metaPc = ac.meta?.PC_NAME;
  const same = norm(metaPc) === norm(pc.name);
  add(same ? OK : BAD, 'Lok Sabha seat: assembly meta vs polygon',
    same ? pc.name : `meta="${metaPc}" polygon="${pc.name}". Official list se seat verify karo (eci.gov.in)`);
}
if (ac && dist && ac.meta?.DIST_NAME) {
  const same = norm(ac.meta.DIST_NAME) === norm(dist.name);
  add(same ? OK : WARN, 'District: assembly meta vs polygon', same ? dist.name : `meta="${ac.meta.DIST_NAME}" polygon="${dist.name}"`);
}

// 3) Representatives (naam sirf official source se, party kabhi nahi)
for (const [office, area] of [['mla', ac], ['mp', pc], ['collector', dist]]) {
  if (!area) continue;
  const rep = await Representative.findOne({ office, areaId: area._id }).lean();
  if (!rep) add(WARN, `representative: ${office}`, `${area.name} ke liye nahi hai (letter me addressee khaali rahega)`);
  else if (!rep.name || /fill_me|todo/i.test(rep.name)) add(BAD, `representative: ${office}`, `naam placeholder hai: "${rep.name}"`);
  else add(OK, `representative: ${office}`, `${rep.name} -> ${area.name} (source check kiya? contactNote me likho)`);
}
const withParty = await Representative.collection.countDocuments({ party: { $exists: true } });
add(withParty ? BAD : OK, 'party field kisi rep me?', String(withParty));
const orphans = await Representative.aggregate([
  { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'a' } },
  { $match: { a: { $size: 0 } } },
  { $count: 'n' },
]);
add(orphans[0]?.n ? BAD : OK, 'representatives bina area ke', String(orphans[0]?.n ?? 0));

// 4) Local body
const lb = await LocalBody.findOne({ areaIds: ac?._id }).lean();
if (!lb) add(WARN, 'local body (Nagar Parishad)', 'koi nahi: npm run seed:bodies');
else add(/verify/i.test(lb.headTitle) ? BAD : OK, 'local body', `${lb.name} / ${lb.headTitle} (head title official site se match karo)`);

// 5) Area naam repeat (CSV import naam se match karta hai)
const dupes = await Area.aggregate([
  { $group: { _id: { level: '$level', name: { $toLower: '$name' } }, n: { $sum: 1 } } },
  { $match: { n: { $gt: 1 } } },
]);
add(dupes.length ? WARN : OK, 'same naam ki areas (ek level me)', dupes.map((d) => `${d._id.level}:${d._id.name}`).join(', ') || '0');

// 6) Rule texts: koi TODO nahi, hash sahi
const rules = await RuleText.find().lean();
if (!rules.length) add(BAD, 'rule texts', '0: npm run build:rules && npm run seed:rules');
for (const r of rules) {
  const todo = r.clauses.some((c) => /^TODO/i.test(c.id) || /^TODO/i.test(c.text));
  const sha = crypto.createHash('sha256').update(JSON.stringify(r.clauses.map((c) => ({ id: c.id, text: c.text })))).digest('hex');
  add(todo ? BAD : sha === r.sha256 ? OK : BAD, `rule: ${r.name} v${r.version}`,
    todo ? 'TODO clause hai' : `${r.clauses.length} clauses, hash ${sha === r.sha256 ? 'match' : 'MISMATCH'}`);
}

console.table(rows);
const bad = rows.filter((r) => r[''] === BAD).length;
console.log(bad ? `${bad} cheez galat hai. Letters release karne se pehle theek karo.` : 'Koi blocker nahi.');
await mongoose.connection.close();
process.exit(bad ? 1 : 0);