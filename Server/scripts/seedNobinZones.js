// Use: npm run seed:nobin   (Khategaon ke paas 4 test zones, circle layer dekhne ke liye)
// Sab zones isTest:true ke saath. Dobara chalao to purane test zones hat kar naye bante hain.
// Production se pehle: NobinZone.deleteMany({ isTest: true })
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { NobinZone } from '../models/NobinZone.js';

await connectDB();
await NobinZone.deleteMany({ isTest: true });

const fakeUsers = (n) => Array.from({ length: n }, () => new mongoose.Types.ObjectId());
const bin = (distanceM, name) => ({ checkedAt: new Date(), found: true, name, kind: 'waste_basket', distanceM });
const none = { checkedAt: new Date(), found: false };

const zones = [
  { c: [76.9132, 22.5933], n: 1, status: 'unverified', nearestBin: none },
  { c: [76.9301, 22.6012], n: 6, status: 'unverified', nearestBin: bin(740, null) },
  { c: [76.8954, 22.5841], n: 10, status: 'verified', nearestBin: none },
  { c: [76.9205, 22.5745], n: 12, status: 'verified', nearestBin: bin(910, 'Bus stand bin') },
];

await NobinZone.insertMany(
  zones.map((z) => ({
    center: { type: 'Point', coordinates: z.c },
    radiusM: 1000,
    reporterIds: fakeUsers(z.n),
    backerCount: z.n,
    status: z.status,
    verifiedAt: z.status === 'verified' ? new Date() : undefined,
    nearestBin: z.nearestBin,
    isTest: true,
  })),
);

console.log(`${zones.length} test no-bin zones banayi gayi`);
await mongoose.connection.close();