import mongoose from 'mongoose';

const { ObjectId, Mixed } = mongoose.Schema.Types;

// GeoJSON Polygon / MultiPolygon (coordinates = [lng, lat], pehle lng!)
const geometrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Polygon', 'MultiPolygon'], required: true },
    coordinates: { type: Mixed, required: true },
  },
  { _id: false },
);

const areaSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['ward', 'assembly', 'loksabha', 'district'], required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true }, // e.g. madhya-pradesh-8 (state + number, taaki repeat na ho)
    state: { type: String, required: true, trim: true },
    geometry: { type: geometrySchema, required: true },
    parentIds: [{ type: ObjectId, ref: 'Area' }],
    isPilot: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    meta: { type: Mixed, default: {} }, // source ki extra info (district name, PC name, category)
  },
  { timestamps: true },
);

areaSchema.index({ geometry: '2dsphere' });
areaSchema.index({ level: 1, code: 1 }, { unique: true }); // import dobara chalane par duplicate nahi banega

export const Area = mongoose.model('Area', areaSchema);
