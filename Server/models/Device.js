import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Client localStorage me random UUID rakhta hai (X-Device-Id header). DB me sirf uska hash.
// Fingerprinting nahi: bas ek speed-bump, ki ek phone se kai accounts bana ke limit na todi ja sake.
const deviceSchema = new mongoose.Schema(
  {
    fingerprintHash: { type: String, required: true, unique: true },
    userId: { type: ObjectId, ref: 'User' }, // aakhri baar kaun use kar raha tha
    lastSeenAt: { type: Date, default: Date.now },
    blocked: { type: Boolean, default: false }, // spam device ko Atlas se block kar sakte ho
  },
  { timestamps: true },
);

deviceSchema.index({ userId: 1 });

export const Device = mongoose.model('Device', deviceSchema);