import mongoose from 'mongoose';
import { NOTES } from '../config/defaults.js';

const { ObjectId } = mongoose.Schema.Types;

// Site par resident ka chhota note. userId kabhi public API me nahi jaati (note anonymous dikhta hai).
const noteSchema = new mongoose.Schema(
  {
    siteId: { type: ObjectId, ref: 'Site', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, minlength: NOTES.minChars, maxlength: NOTES.maxChars },
    // visible = sab ko dikhta hai. flagged = AI moderation ne hataya (sirf likhne wale ko dikhta hai)
    status: { type: String, enum: ['visible', 'flagged'], default: 'visible' },
    flagReason: String, // abuse | spam | off_topic | names_person | personal_data
  },
  { timestamps: true },
);

noteSchema.index({ siteId: 1, status: 1, createdAt: -1 });
noteSchema.index({ siteId: 1, userId: 1 });

export const Note = mongoose.model('Note', noteSchema);