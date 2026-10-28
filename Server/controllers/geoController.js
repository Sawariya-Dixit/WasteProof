import { resolve } from '../services/geoService.js';

export async function resolveLocation(req, res) {
  const { lat, lng } = req.valid.query;
  const data = await resolve(lat, lng);
  res.json({ success: true, data });
}
