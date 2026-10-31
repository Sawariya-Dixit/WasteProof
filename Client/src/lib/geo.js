import { MAX_BBOX_SPAN_DEG } from './mapConfig';

// Stable empty array: nayi [] har render par banti to MapView ka effect baar-baar chalta
export const EMPTY_SITES = [];

// Server ke sites -> MapLibre ka GeoJSON
export function sitesToGeoJSON(sites) {
  return {
    type: 'FeatureCollection',
    features: sites.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: s.location.coordinates },
      properties: {
        id: s._id,
        type: s.type,
        status: s.status,
        backerCount: s.backerCount ?? 0,
        noCount: s.noCount ?? 0,
        reportCount: s.reportCount ?? 0,
      },
    })),
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fixed = (v) => Number(v.toFixed(2));

// Box ko bahar ki taraf 2 decimal (~1 km) par round karo:
// chhote pan par naya request nahi jata, aur box kabhi chhota nahi hota (pins miss nahi hote).
export function roundBbox([w, s, e, n]) {
  return [
    clamp(fixed(Math.floor(w * 100) / 100), -180, 180),
    clamp(fixed(Math.floor(s * 100) / 100), -90, 90),
    clamp(fixed(Math.ceil(e * 100) / 100), -180, 180),
    clamp(fixed(Math.ceil(n * 100) / 100), -90, 90),
  ];
}

// Server 5 degree se bada box reject karta hai (422)
export function bboxTooLarge([w, s, e, n]) {
  return e - w > MAX_BBOX_SPAN_DEG || n - s > MAX_BBOX_SPAN_DEG;
}
