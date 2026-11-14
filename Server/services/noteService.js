import { Note } from '../models/Note.js';
import { Site } from '../models/Site.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { findPii } from '../utils/pii.js';
import { enqueueSummary } from '../queues/noteQueue.js';
import { NOTES } from '../config/defaults.js';

async function assertSite(siteId) {
  const ok = await Site.exists({ _id: siteId, status: { $ne: 'hidden' } });
  if (!ok) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
}

// Peeche summary banwao. Queue (Redis) na chale to bhi note save ho chuka hota hai.
function requestSummary(siteId) {
  enqueueSummary(siteId).catch((err) => logger.warn({ err: err.message }, 'note summary enqueue fail'));
}

const shape = (n, viewerId) => ({
  id: n._id,
  text: n.text,
  createdAt: n.createdAt,
  mine: viewerId ? String(n.userId) === String(viewerId) : false,
  flagged: n.status === 'flagged', // sirf likhne wale ko dikhta hai
});

// GET /sites/:id/notes. Public: sirf visible notes. Login wale ko apne flagged notes bhi (userId kabhi nahi jaati).
export async function listNotes(siteId, viewerId, { page, limit }) {
  const site = await Site.findOne({ _id: siteId, status: { $ne: 'hidden' } })
    .select('noteSummary')
    .lean();
  if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');

  const visible = { siteId, status: 'visible' };
  const filter = viewerId
    ? { siteId, $or: [{ status: 'visible' }, { status: 'flagged', userId: viewerId }] }
    : visible;

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('text status createdAt userId')
      .lean(),
    Note.countDocuments(visible),
  ]);

  const s = site.noteSummary;
  return {
    notes: notes.map((n) => shape(n, viewerId)),
    summary: s?.en
      ? { en: s.en, hi: s.hi, noteCount: s.noteCount, generatedAt: s.generatedAt }
      : null,
    meta: { page, limit, total },
  };
}

// POST /sites/:id/notes
export async function addNote(user, siteId, { text }) {
  await assertSite(siteId);

  const pii = findPii(text);
  if (pii.length) throw new AppError('Note me personal jaankari hai', 422, 'PII_DETECTED', { reasons: pii });

  const mineHere = await Note.countDocuments({ siteId, userId: user._id });
  if (mineHere >= NOTES.perUserPerSite) {
    throw new AppError('Is site par aap aur notes nahi likh sakte', 409, 'NOTE_LIMIT');
  }

  const note = await Note.create({ siteId, userId: user._id, text });
  requestSummary(siteId);
  return shape(note.toObject(), user._id);
}

// DELETE /sites/:id/notes/:noteId (sirf apna note)
export async function deleteNote(user, siteId, noteId) {
  const gone = await Note.findOneAndDelete({ _id: noteId, siteId, userId: user._id });
  if (!gone) throw new AppError('Note nahi mila', 404, 'NOT_FOUND');
  requestSummary(siteId); // summary me ye note ab nahi hona chahiye
  return { id: noteId };
}