import mongoose from 'mongoose';
import { pointSchema } from './pointSchema.js';

const { ObjectId } = mongoose.Schema.Types;

// "Mere 1 km me dustbin nahi hai" reports ka community zone.
// center hamesha ~110 m round hota hai, reporter ka asli point kabhi save / public nahi hota.
const nobinZoneSchema = new mongoose.Schema(
  {
    center: { type: pointSchema, required: true },
    radiusM: { type: Number, default: 1000 },
    reporterIds: [{ type: ObjectId, ref: 'User' }], // public API me kabhi nahi jaati
    backerCount: { type: Number, default: 1 },
    status: { type: String, enum: ['unverified', 'verified'], default: 'unverified' },
    verifiedAt: Date,
    // OSM me sabse paas ka mapped bin. found:false = 1 km me koi mapped bin nahi mila.
    // Sirf evidence hai, verification ko block nahi karta.
    nearestBin: {
      checkedAt: Date,
      found: Boolean,
      name: String,
      kind: String, // waste_basket | waste_disposal | recycling
      distanceM: Number,
    },
    areaIds: {
      ward: { type: ObjectId, ref: 'Area' },
      assembly: { type: ObjectId, ref: 'Area' },
      loksabha: { type: ObjectId, ref: 'Area' },
      district: { type: ObjectId, ref: 'Area' },
    },
    isTest: { type: Boolean, default: false },
  },
  { timestamps: true },
);

nobinZoneSchema.index({ center: '2dsphere' });
nobinZoneSchema.index({ reporterIds: 1 });

export const NobinZone = mongoose.model('NobinZone', nobinZoneSchema);
