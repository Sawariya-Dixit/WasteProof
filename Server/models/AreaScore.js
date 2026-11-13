import mongoose from 'mongoose';

const { ObjectId, Mixed } = mongoose.Schema.Types;

const areaScoreSchema = new mongoose.Schema(
  {
    areaId: { type: ObjectId, ref: 'Area', required: true },
    level: { type: String, enum: ['ward', 'assembly', 'loksabha', 'district'], required: true },
    cityScore: { type: Number, default: null },
    citizenScore: { type: Number, default: null },
    binScore: { type: Number, default: null },
    overallScore: { type: Number, default: null }, // teeno ka average, ranking isi se
    verifiedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    scoreVisible: { type: Boolean, default: false }, // verifiedCount >= 10
    diagnosis: { type: String, default: null },
    insights: { type: [Mixed], default: [] }, // [{ code, params }] client i18n se text banata hai
    areaKm2: Number,
    centroid: [Number], // [lng, lat]
    computedAt: Date,
  },
  { timestamps: true },
);

areaScoreSchema.index({ areaId: 1 }, { unique: true });
areaScoreSchema.index({ level: 1, scoreVisible: 1, overallScore: 1 });

export const AreaScore = mongoose.model('AreaScore', areaScoreSchema);
