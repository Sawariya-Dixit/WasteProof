import mongoose from 'mongoose';

// Reverse geocode ka cache. Mongo TTL index expiresAt par document apne aap delete kar deta hai.
const geoCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // "22.590,76.910" (lat,lng 3 decimal = ~110 m)
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

geoCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GeoCache = mongoose.model('GeoCache', geoCacheSchema);
