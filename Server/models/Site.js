import mongoose from 'mongoose';
import { pointSchema } from './pointSchema.js';
import { REPORT_TYPES, SITE_STATUSES } from '../config/defaults.js';

const { ObjectId } = mongoose.Schema.Types;

const siteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: REPORT_TYPES, required: true },
    location: { type: pointSchema, required: true },
    status: { type: String, enum: SITE_STATUSES, default: 'unverified' },
    backers: [{ type: ObjectId, ref: 'User' }],
    backerCount: { type: Number, default: 0 },
    noCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    photoUrls: [String],
    firstReportId: { type: ObjectId, ref: 'Report' },
    embedding: { type: [Number], select: false },
    areaIds: {
      ward: { type: ObjectId, ref: 'Area' },
      assembly: { type: ObjectId, ref: 'Area' },
      loksabha: { type: ObjectId, ref: 'Area' },
      district: { type: ObjectId, ref: 'Area' },
    },
    localBodyId: { type: ObjectId, ref: 'LocalBody' },
    nearby: {
      schools: [String],
      hospitals: [String],
      water: [String],
      drains: [String],
    },
    cleanedAt: Date,
    isTest: { type: Boolean, default: false }, // seed/test data ki pehchaan
  },
  { timestamps: true },
);

siteSchema.index({ location: '2dsphere' });
siteSchema.index({ status: 1, type: 1 });
siteSchema.index({ 'areaIds.ward': 1 });
siteSchema.index({ 'areaIds.assembly': 1 });
siteSchema.index({ 'areaIds.loksabha': 1 });
siteSchema.index({ 'areaIds.district': 1 });

export const Site = mongoose.model('Site', siteSchema);