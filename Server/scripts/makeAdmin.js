import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Use: node scripts/makeAdmin.js user@email.com');
  process.exit(1);
}

await connectDB();
const r = await User.updateOne({ email }, { role: 'admin' });
console.log(
  r.matchedCount
    ? `${email} ab admin hai`
    : 'User nahi mila (pehle ek baar login karke /users/me bulao)',
);
await mongoose.connection.close();
