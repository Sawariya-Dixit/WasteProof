import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const localBodySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. Khategaon Nagar Parishad
    type: { type: String, required: true, trim: true }, // nagar_parishad, municipal_corporation, ...
    district: { type: String, required: true, trim: true },
    headTitle: { type: String, required: true, trim: true }, // letter ka addressee: "Chief Municipal Officer"
    areaIds: [{ type: ObjectId, ref: 'Area' }],
  },
  { timestamps: true },
);

localBodySchema.index({ district: 1 });

export const LocalBody = mongoose.model('LocalBody', localBodySchema);
