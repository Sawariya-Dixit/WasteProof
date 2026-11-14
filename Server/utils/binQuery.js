import { NOBIN } from '../config/defaults.js';
import { distanceM } from './geo.js';

// OpenStreetMap par mapped dustbin (waste basket, waste disposal bin, recycling point)
export function buildBinQuery(lat, lng, radius = NOBIN.binSearchM) {
  return `[out:json][timeout:20];
(
  nwr(around:${radius},${lat},${lng})["amenity"~"^(waste_basket|waste_disposal|recycling)$"];
);
out tags center;`;
}

const nameOf = (t) => String(t?.name || t?.['name:en'] || '').trim().slice(0, 80);

// Pure function: Overpass ka jawab -> sabse paas ka bin { name, kind, distanceM } ya null (radius me koi nahi)
export function parseNearestBin(json, lat, lng, maxM = NOBIN.binSearchM) {
  let best = null;
  for (const el of json?.elements ?? []) {
    const p = el.type === 'node' ? { lat: el.lat, lon: el.lon } : el.center;
    if (!Number.isFinite(p?.lat) || !Number.isFinite(p?.lon)) continue;
    const d = Math.round(distanceM([lng, lat], [p.lon, p.lat]));
    if (d > maxM) continue;
    if (!best || d < best.distanceM) {
      best = { name: nameOf(el.tags) || null, kind: el.tags?.amenity ?? 'waste_basket', distanceM: d };
    }
  }
  return best;
}