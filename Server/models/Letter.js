import mongoose from 'mongoose';
import { LETTER_SCOPES, LETTER_LANGS, REPORT_TYPES } from '../config/defaults.js';

const { ObjectId, Mixed } = mongoose.Schema.Types;

const addresseeSchema = new mongoose.Schema(
  {
    role: String, // 'to' | 'cc'
    office: String, // localBody | councillor | mla | mp | collector
    title: String,
    orgName: String,
    name: String, // seed me naam na ho to null (party kabhi nahi)
  },
  { _id: false },
);

const clauseSchema = new mongoose.Schema(
  {
    ruleName: String,
    version: String,
    sha256: String, // rule text ka hash, letter ke waqt ka
    clauseId: String,
    text: String,
  },
  { _id: false },
);

const letterSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: LETTER_SCOPES, required: true },
    siteId: { type: ObjectId, ref: 'Site' },
    areaId: { type: ObjectId, ref: 'Area' },
    issueType: { type: String, enum: REPORT_TYPES, required: true },
    lang: { type: String, enum: LETTER_LANGS, default: 'en' },
    subject: { type: String, required: true },
    body: { type: String, required: true }, // poora letter, print / PDF / copy isi se
    addressees: [addresseeSchema],
    clauses: [clauseSchema],
    // { counts: {reports, backers, verified, total}, dates: {first, last}, photos: [url], location: {lat, lng, text} }
    evidence: { type: Mixed, default: {} },
    usedTemplate: { type: Boolean, default: false },
    templateReason: { type: String, default: null }, // llm_off | llm_unavailable | quote_mismatch | false_verified ...
  },
  { timestamps: true },
);

letterSchema.index({ userId: 1, createdAt: -1 });
letterSchema.index({ userId: 1, siteId: 1 });
letterSchema.index({ userId: 1, areaId: 1 });

export const Letter = mongoose.model('Letter', letterSchema);
