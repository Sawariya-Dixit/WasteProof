import { api } from './client';

// bbox = [minLng, minLat, maxLng, maxLat]. Ye endpoint public hai (login nahi chahiye).
export async function fetchSites({ bbox, type, status }) {
  const res = await api.get('/sites', {
    params: { bbox: bbox.join(','), type, status }, // undefined params axios hata deta hai
  });
  return res.data.data.sites;
}
export async function fetchSite(id) {
  const res = await api.get(`/sites/${id}`);
  return res.data.data.site;
}
// body = { lat, lng, accuracyM } (voter ki abhi ki location). Server doori check karta hai.
export async function voteOnSite(id, { value, lat, lng, accuracyM }) {
  const res = await api.post(`/sites/${id}/votes`, { value, lat, lng, accuracyM });
  return res.data.data; // { vote: { value, distanceM }, site: { id, status, backerCount, noCount } }
}

export async function meTooSite(id, { lat, lng, accuracyM }) {
  const res = await api.post(`/sites/${id}/me-too`, { lat, lng, accuracyM });
  return res.data.data;
}

// reason: face_visible | plate_visible | not_waste | inappropriate | other
export async function reportPhoto(id, { photoUrl, reason }) {
  const res = await api.post(`/sites/${id}/report-photo`, { photoUrl, reason });
  return res.data.data; // { flagged, removed }
}

// key = signUpload() wali after-photo ki public_id. Server photo blur karke judge chalata hai.
export async function claimCleanup(id, { key, lat, lng, accuracyM }) {
  const res = await api.post(`/sites/${id}/cleanups`, { key, lat, lng, accuracyM });
  return res.data.data; // { cleanup: { id, status }, site: { id, status } }
}