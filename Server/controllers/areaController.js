import {
  getRanking,
  getAreasGeoJSON,
  getAreaDetail,
  getAreaScore,
  getPlaces,
} from '../services/areaService.js';

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

export async function areaDetail(req, res) {
  const data = await getAreaDetail(req.valid.params.id);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data });
}

export async function areaScore(req, res) {
  const score = await getAreaScore(req.valid.params.id);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: { score } });
}

export async function places(req, res) {
  const places = await getPlaces(req.valid.query);
  res.json({ success: true, data: { places }, meta: { count: places.length } });
}