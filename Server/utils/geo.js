import { INDIA_BOUNDS } from '../config/defaults.js';

export function inIndia(lat, lng) {
  const b = INDIA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

// Do points ke beech doori (meter), haversine. Points GeoJSON ke [lng, lat] order me.
export function distanceM([lng1, lat1], [lng2, lat2]) {
  const R = 6371008.8;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}