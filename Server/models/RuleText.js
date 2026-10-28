import mongoose from 'mongoose';

// Official rule ke clauses. Letter me quote hone se pehle yahin se word-by-word match hoga.
const clauseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g. "15(b)"
    text: { type: String, required: true },
  },
  { _id: false },
);

const ruleTextSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. Solid Waste Management Rules
    source: { type: String, required: true, trim: true }, // official PDF / gazette link
    version: { type: String, required: true, trim: true }, // e.g. 2026
    sha256: { type: String, required: true }, // clauses JSON ka hash, badlav pakadne ke liye
    clauses: [clauseSchema],
  },
  { timestamps: true },
);

ruleTextSchema.index({ name: 1, version: 1 }, { unique: true });

export const RuleText = mongoose.model('RuleText', ruleTextSchema);
