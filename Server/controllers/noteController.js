import { listNotes, addNote, deleteNote } from '../services/noteService.js';

export async function getNotes(req, res) {
  const { notes, summary, meta } = await listNotes(req.valid.params.id, req.user?._id, req.valid.query);
  res.json({ success: true, data: { notes, summary }, meta });
}

export async function postNote(req, res) {
  const note = await addNote(req.user, req.valid.params.id, req.body);
  res.status(201).json({ success: true, data: { note } });
}

export async function removeNote(req, res) {
  const data = await deleteNote(req.user, req.valid.params.id, req.valid.params.noteId);
  res.json({ success: true, data });
}