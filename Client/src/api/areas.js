import { api } from './client';

export async function fetchAreaRanking({ level }) {
  const res = await api.get('/areas/ranking', { params: { level } });
  return res.data.data.areas;
}

export async function fetchAreasMap({ level }) {
  const res = await api.get('/areas/map', { params: { level } });
  return res.data.data.geojson;
}