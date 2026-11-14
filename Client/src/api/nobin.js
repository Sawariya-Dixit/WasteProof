import { api } from './client';

// bbox = [minLng, minLat, maxLng, maxLat]. Public endpoint (login nahi chahiye).
export async function fetchNobinZones({ bbox }) {
  const res = await api.get('/nobin-zones', { params: { bbox: bbox.join(',') } });
  return res.data.data.zones;
}

// body = { lat, lng, accuracyM } (khade hone ki jagah)
export async function reportNobin({ lat, lng, accuracyM }) {
  const res = await api.post('/nobin-zones', { lat, lng, accuracyM });
  return res.data.data; // { zone: { id, center, radiusM, backerCount, status, nearestBin }, joined }
}