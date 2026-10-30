// Use: node scripts/seedLocalBodies.js
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Area } from '../models/Area.js';
import { LocalBody } from '../models/LocalBody.js';

await connectDB();

// Khategaon assembly area (pilot). Naam testResolve se match karo.
const assembly = await Area.findOne({ level: 'assembly', name: /^khategaon$/i }).select('_id');
if (!assembly) console.warn('Khategaon assembly area nahi mili. Pehle importGeoJSON chalao.');

await LocalBody.updateOne(
  { name: 'Khategaon Nagar Parishad' },
  {
    $set: {
      type: 'nagar_parishad',
      district: 'Dewas',
      headTitle: 'Chief Municipal Officer', // VERIFY karo: asli head title kya likhte hain
      areaIds: assembly ? [assembly._id] : [],
    },
  },
  { upsert: true },
);

console.log('Khategaon Nagar Parishad saved');
await mongoose.connection.close();
