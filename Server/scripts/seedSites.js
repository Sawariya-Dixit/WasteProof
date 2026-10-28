import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Site } from '../models/Site.js';
import { REPORT_TYPES } from '../config/defaults.js';

// [lng, lat]. Pehle 12 Khategaon ke aas-paas, aakhri 3 Dewas shehar me
const POINTS = [
  [76.9132, 22.5933],
  [76.9085, 22.5981],
  [76.9201, 22.5902],
  [76.9054, 22.5879],
  [76.9238, 22.5968],
  [76.9167, 22.6012],
  [76.9101, 22.5842],
  [76.9279, 22.5921],
  [76.9019, 22.5953],
  [76.919, 22.5855],
  [76.9133, 22.5934],
  [76.9141, 22.5939], // Day 10 ke site merge test ke liye bilkul paas paas
  [76.0553, 22.9659],
  [76.0612, 22.9701],
  [76.0489, 22.9624],
];

const STATUS_BY_INDEX = ['unverified', 'unverified', 'verified', 'unverified', 'cleaned'];

await connectDB();
await Site.init(); // indexes ban jayein
await Site.deleteMany({ isTest: true });

const docs = POINTS.map(([lng, lat], i) => {
  const status = STATUS_BY_INDEX[i % STATUS_BY_INDEX.length];
  return {
    type: REPORT_TYPES[i % REPORT_TYPES.length],
    location: { type: 'Point', coordinates: [lng, lat] },
    status,
    backerCount: status === 'verified' ? 10 : (i % 9) + 1,
    reportCount: (i % 4) + 1,
    isTest: true,
  };
});

await Site.insertMany(docs);
console.log(`${docs.length} test sites bana diye`);
await mongoose.connection.close();
