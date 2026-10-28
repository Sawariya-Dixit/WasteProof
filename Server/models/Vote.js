import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const voteSchema = new mongoose.Schema(
  {
    siteId: { type: ObjectId, ref: 'Site', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    value: { type: String, enum: ['yes', 'no', 'me_too'], required: true },
    distanceM: Number,
  },
  { timestamps: true },
);

voteSchema.index({ siteId: 1, userId: 1 }, { unique: true }); // ek user, ek site, ek vote

export const Vote = mongoose.model('Vote', voteSchema);
