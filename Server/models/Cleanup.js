import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const cleanupSchema = new mongoose.Schema(
  {
    siteId: { type: ObjectId, ref: 'Site', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    afterPhotoUrl: { type: String, required: true }, // blurred public copy
        sha256: { type: String }, // after-photo ka hash, same photo dobara nahi chalegi

    status: { type: String, enum: ['claimed', 'accepted', 'rejected'], default: 'claimed' },

    check: { verdict: String, source: String }, // judge ne after-photo par kya kaha
    distanceM: Number,
  },
  { timestamps: true },
);
cleanupSchema.index({ sha256: 1 }, { unique: true, sparse: true }); // sparse: purani claims (bina hash) rok na paayein


export const Cleanup = mongoose.model('Cleanup', cleanupSchema);
