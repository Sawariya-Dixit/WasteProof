import { listZones, reportNoBin } from '../services/nobinService.js';

export async function getZones(req, res) {
  const zones = await listZones(req.valid.query);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ success: true, data: { zones }, meta: { count: zones.length } });
}

export async function postZone(req, res) {
  const data = await reportNoBin(req.user, req.body); // { zone, joined }
  res.status(201).json({ success: true, data });
}