import { getRanking, getAreasGeoJSON } from '../services/areaService.js';

export async function ranking(req, res) {
  const areas = await getRanking(req.valid.query);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: { areas }, meta: { count: areas.length } });
}

export async function areasMap(req, res) {
  const geojson = await getAreasGeoJSON(req.valid.query);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: { geojson } });
}