import { api } from './client';

// payload = { scope, siteId?, areaId?, issueType?, lang }. Server LLM chalata hai, isliye lamba timeout.
export async function createLetter(payload) {
  const res = await api.post('/letters', payload, { timeout: 45000 });
  return res.data.data; // { letter }
}

export async function fetchLetter(id) {
  const res = await api.get(`/letters/${id}`);
  return res.data.data.letter;
}

// PDF file (Blob). Token header lagana padta hai, isliye seedha <a href> nahi chalta.
export async function fetchLetterPdf(id) {
  const res = await api.get(`/letters/${id}/pdf`, { responseType: 'blob', timeout: 30000 });
  return res.data;
}