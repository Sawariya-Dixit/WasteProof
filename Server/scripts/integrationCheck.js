// Use: npm run check:all
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { getRedis, closeRedis } from '../config/redis.js';
import { Area } from '../models/Area.js';
import { Site } from '../models/Site.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Representative } from '../models/Representative.js';
import { LocalBody } from '../models/LocalBody.js';
import { RuleText } from '../models/RuleText.js';
import { AreaScore } from '../models/AreaScore.js';
import { SCORES } from '../config/defaults.js';

const KHATEGAON = [76.9132, 22.5933]; // [lng, lat]
const rows = [];
const add = (level, name, detail = '') => rows.push({ '': level, check: name, detail });
const OK = '✅', WARN = '⚠️ ', BAD = '❌';

await connectDB();

// 1) Areas + point-in-polygon
const byLevel = Object.fromEntries(
  (await Area.aggregate([{ $group: { _id: '$level', n: { $sum: 1 } } }])).map((r) => [r._id, r.n]),
);
for (const l of ['assembly', 'loksabha', 'district']) {
  add(byLevel[l] ? OK : BAD, `areas: ${l}`, `${byLevel[l] ?? 0}`);
}
const pt = { type: 'Point', coordinates: KHATEGAON };
const hit = await Area.findOne({ level: 'assembly', geometry: { $geoIntersects: { $geometry: pt } } }).select('name isPilot');
add(hit ? OK : BAD, 'Khategaon point -> assembly', hit ? `${hit.name}${hit.isPilot ? ' (pilot)' : ' (isPilot false!)'}` : 'nahi mila');

// 2) Reference data
const reps = await Representative.countDocuments();
add(reps ? OK : WARN, 'representatives', `${reps}`);
const lb = await LocalBody.countDocuments();
add(lb ? OK : WARN, 'local bodies', `${lb}`);
const rules = await RuleText.find().select('name version sha256 clauses').lean();
add(rules.length ? OK : BAD, 'rule texts', rules.map((r) => `${r.name} v${r.version} (${r.clauses.length} clauses)`).join('; ') || '0');

// 3) Users
const admins = await User.countDocuments({ role: 'admin' });
add(admins ? OK : WARN, 'admin users', admins ? `${admins}` : '0 (npm run make:admin -- email)');

// 4) Pipeline state
const st = Object.fromEntries((await Report.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])).map((r) => [r._id, r.n]));
const stuck = (st.pending ?? 0) + (st.needs_review ?? 0);
add(stuck ? WARN : OK, 'reports', JSON.stringify(st));
const sites = await Site.countDocuments({ isTest: { $ne: true } });
const testSites = await Site.countDocuments({ isTest: true });
add(OK, 'sites', `real ${sites}, test ${testSites}`);
if (testSites && SCORES.includeTest) add(WARN, 'scores me test sites', 'SCORES.includeTest=true: deploy se pehle false karo');
add((await AreaScore.countDocuments()) ? OK : WARN, 'area_scores', `${await AreaScore.countDocuments()} (npm run scores)`);

// 5) Redis
try {
  const pong = await getRedis().ping();
  add(pong === 'PONG' ? OK : BAD, 'redis', pong);
} catch (e) {
  add(BAD, 'redis', e.message);
}

// 6) Env (sirf maujood hai ya nahi)
const has = (k) => !!process.env[k];
add(has('GROQ_API_KEY') || env.VERIFY_LLM === 'off' ? OK : WARN, 'LLM judge', env.VERIFY_LLM === 'off' ? 'off' : has('GROQ_API_KEY') ? 'key hai' : 'GROQ_API_KEY nahi');
add(env.PRIVACY_SCAN === 'rekognition' && !(has('AWS_ACCESS_KEY_ID') && has('AWS_SECRET_ACCESS_KEY')) ? WARN : OK, 'privacy scan', env.PRIVACY_SCAN);
add(OK, 'env', `${env.NODE_ENV}, cron ${env.SCORES_CRON}`);

console.table(rows);
const bad = rows.filter((r) => r[''] === BAD).length;
console.log(bad ? `${bad} cheez theek karni hai.` : 'Koi blocker nahi.');
await closeRedis();
await mongoose.connection.close();
process.exit(bad ? 1 : 0);