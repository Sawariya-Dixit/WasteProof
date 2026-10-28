import { INDIA_BOUNDS } from '../config/defaults.js';

export function inIndia(lat, lng) {
  const b = INDIA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
