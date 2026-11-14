import { api } from './client';

// Return: { notes, summary, total }. Public endpoint (login ho to apne flagged notes bhi aate hain).
export async function fetchNotes(siteId, { limit = 20 } = {}) {
  const res = await api.get(`/sites/${siteId}/notes`, { params: { limit } });
  return { ...res.data.data, total: res.data.meta?.total ?? 0 };
}

export async function addNote(siteId, text) {
  const res = await api.post(`/sites/${siteId}/notes`, { text });
  return res.data.data.note;
}

export async function deleteNote(siteId, noteId) {
  const res = await api.delete(`/sites/${siteId}/notes/${noteId}`);
  return res.data.data;
}