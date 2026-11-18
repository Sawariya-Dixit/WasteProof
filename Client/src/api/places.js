import { api } from './client';

// bbox = [minLng, minLat, maxLng, maxLat]. Public endpoint.
// Return: [{ id, name, state, totalCount, verifiedCount }] (zyada reports wale pehle)
export async function fetchPlaces({ bbox, limit = 20 }) {
  const res = await api.get('/places', { params: { bbox: bbox.join(','), limit } });
  return res.data.data.places;
}