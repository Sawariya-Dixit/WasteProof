import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Kharab photo (chehra / plate dikh raha, kachra nahi, galat) ka flag. Admin review ke kaam aayega.
const photoFlagSchema = new mongoose.Schema(
  {
    siteId: { type: ObjectId, ref: 'Site', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    photoUrl: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);

photoFlagSchema.index({ siteId: 1, userId: 1, photoUrl: 1 }, { unique: true }); // ek user ek photo ek baar
photoFlagSchema.index({ siteId: 1, photoUrl: 1 });

export const PhotoFlag = mongoose.model('PhotoFlag', photoFlagSchema);