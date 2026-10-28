import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Party ka field jaan-boojh ke nahi hai (privacy rule: representatives ke saath party info nahi)
const representativeSchema = new mongoose.Schema(
  {
    office: {
      type: String,
      enum: ['councillor', 'mla', 'mp', 'commissioner', 'collector'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    areaId: { type: ObjectId, ref: 'Area', required: true },
    contactNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

representativeSchema.index({ areaId: 1, office: 1 });

export const Representative = mongoose.model('Representative', representativeSchema);
