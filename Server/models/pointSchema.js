import mongoose from 'mongoose';

export const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat], pehle lng!
  },
  { _id: false },
);
