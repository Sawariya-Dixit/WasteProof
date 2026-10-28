import mongoose from 'mongoose';
import { pointSchema } from './pointSchema.js';
import { REPORT_TYPES } from '../config/defaults.js';

const { ObjectId, Mixed } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    deviceId: { type: ObjectId, ref: 'Device' },
    siteId: { type: ObjectId, ref: 'Site' },
    type: { type: String, enum: REPORT_TYPES, required: true },
    originalKey: { type: String, required: true, select: false }, // private original, kabhi public nahi
    blurredUrl: String,
    sha256: { type: String, required: true, unique: true },
    pHash: String,
    embedding: { type: [Number], select: false },
    location: { type: pointSchema, required: true },
    accuracyM: Number,
    capturedAt: { type: Date, required: true },
    note: { type: String, maxlength: 300 },
    status: {
      type: String,
      enum: ['pending', 'passed', 'rejected', 'community_check', 'needs_reporter_confirm', 'needs_review'],
      default: 'pending',
    },
    pipeline: { type: Mixed, default: {} },
    attempts: { type: Number, default: 0 },
    materials: [String],
    hazards: [String],
  },
  { timestamps: true },
);

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ status: 1 });

export const Report = mongoose.model('Report', reportSchema);