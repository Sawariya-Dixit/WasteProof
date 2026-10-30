// Use: node scripts/seedRules.js
// data/rules/*.json padhta hai, clauses ka sha256 nikalta hai, RuleText me upsert karta hai.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { RuleText } from '../models/RuleText.js';

const DIR = path.resolve('data/rules');
// Whitespace ek jaisa karo. Quote verifier me bhi yahi normalisation lagega.
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
if (!files.length) {
  console.error('data/rules/ me koi .json nahi mili');
  process.exit(1);
}

await connectDB();

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const clauses = (raw.clauses || []).map((c) => ({ id: String(c.id).trim(), text: norm(c.text) }));

  if (!raw.name || !raw.source || !raw.version || !clauses.length) {
    console.error(`${f}: name, source, version aur clauses chahiye`);
    process.exit(1);
  }
  if (clauses.some((c) => /^TODO/i.test(c.id) || /^TODO/i.test(c.text))) {
    console.error(`${f}: TODO wale clauses abhi bhi hain. Pehle asli text bharo.`);
    process.exit(1);
  }
  const ids = clauses.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    console.error(`${f}: clause id repeat ho rahi hai`);
    process.exit(1);
  }

  const sha256 = crypto.createHash('sha256').update(JSON.stringify(clauses)).digest('hex');
  await RuleText.updateOne(
    { name: raw.name, version: raw.version },
    { $set: { source: raw.source, sha256, clauses } },
    { upsert: true },
  );
  console.log(`${f}: ${clauses.length} clauses saved, sha256 ${sha256.slice(0, 12)}...`);
}

await mongoose.connection.close();
