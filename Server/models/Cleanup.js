import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const cleanupSchema = new mongoose.Schema(
  {
    siteId: { type: ObjectId, ref: 'Site', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    afterPhotoUrl: { type: String, required: true }, // blurred public copy
    status: { type: String, enum: ['claimed', 'accepted', 'rejected'], default: 'claimed' },
    check: { verdict: String, source: String }, // judge ne after-photo par kya kaha
    distanceM: Number,
  },
  { timestamps: true },
);

cleanupSchema.index({ siteId: 1 });

export const Cleanup = mongoose.model('Cleanup', cleanupSchema);
