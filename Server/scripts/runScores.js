import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { computeAllScores } from '../services/scoreService.js';
import { AreaScore } from '../models/AreaScore.js';

await connectDB();
await computeAllScores();

const rows = await AreaScore.find().populate('areaId', 'name').lean();
console.table(
  rows.map((r) => ({
    level: r.level,
    area: r.areaId?.name,
    km2: r.areaKm2,
    verified: r.verifiedCount,
    total: r.totalCount,
    visible: r.scoreVisible,
    city: r.cityScore,
    citizen: r.citizenScore,
    bin: r.binScore,
    overall: r.overallScore,
    diagnosis: r.diagnosis,
  })),
);
await mongoose.connection.close();