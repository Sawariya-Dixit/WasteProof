// Use: node scripts/seedRepresentatives.js
import fs from 'node:fs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Area } from '../models/Area.js';
import { Representative } from '../models/Representative.js';

// Office kis level ki area se judta hai (councillor/commissioner baad me, ward map ke saath)
const LEVEL_FOR_OFFICE = { mla: 'assembly', mp: 'loksabha', collector: 'district' };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const lines = fs.readFileSync('data/representatives.csv', 'utf8').split(/\r?\n/).filter(Boolean);
const [header, ...rows] = lines;
const cols = header.split(',').map((c) => c.trim());

await connectDB();
let saved = 0;

for (const line of rows) {
  const v = line.split(',').map((x) => x.trim());
  const r = Object.fromEntries(cols.map((c, i) => [c, v[i] || '']));

  if (!r.name || r.name === 'FILL_ME') {
    console.warn(`SKIP (naam nahi bhara): ${r.office} ${r.areaName}`);
    continue;
  }
  if (LEVEL_FOR_OFFICE[r.office] !== r.areaLevel) {
    console.warn(`SKIP (office/level match nahi): ${r.office} ${r.areaLevel}`);
    continue;
  }

  const area = await Area.findOne({
    level: r.areaLevel,
    name: new RegExp(`^${esc(r.areaName)}$`, 'i'),
  }).select('_id');
  if (!area) {
    console.warn(`SKIP (area DB me nahi mili): ${r.areaLevel} "${r.areaName}"`);
    continue;
  }

  await Representative.updateOne(
    { areaId: area._id, office: r.office },
    { $set: { name: r.name, contactNote: r.contactNote || undefined } },
    { upsert: true },
  );
  saved++;
  console.log(`OK: ${r.office} ${r.areaName} -> ${r.name}`);
}

console.log(`${saved} representatives saved`);
await mongoose.connection.close();
