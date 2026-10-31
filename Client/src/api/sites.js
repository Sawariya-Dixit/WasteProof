import { api } from './client';

// bbox = [minLng, minLat, maxLng, maxLat]. Ye endpoint public hai (login nahi chahiye).
export async function fetchSites({ bbox, type, status }) {
  const res = await api.get('/sites', {
    params: { bbox: bbox.join(','), type, status }, // undefined params axios hata deta hai
  });
  return res.data.data.sites;
}
