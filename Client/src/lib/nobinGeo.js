// Stable empty array: nayi [] har render par banti to MapView ka effect baar-baar chalta
export const EMPTY_ZONES = [];

// Asli meter ka circle (polygon). MapLibre ka circle layer pixels me hota hai, isliye polygon banate hain.
export function circlePolygon([lng, lat], radiusM, steps = 48) {
  const R = 6371008.8;
  const d = radiusM / R;
  const rad = Math.PI / 180;
  const lat1 = lat * rad;
  const lng1 = lng * rad;
  const ring = [];
  for (let i = 0; i < steps; i++) {
    const b = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
    const lng2 =
      lng1 +
      Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}

// Server ke zones -> MapLibre GeoJSON. Properties sirf simple values (MapLibre null / object nahi rakhta).
export function zonesToGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      geometry: circlePolygon([z.center.lng, z.center.lat], z.radiusM),
      properties: {
        id: z.id,
        status: z.status,
        backerCount: z.backerCount,
        radiusM: z.radiusM,
        binChecked: z.nearestBin ? 1 : 0,
        binFound: z.nearestBin?.found ? 1 : 0,
        binName: z.nearestBin?.name ?? '',
        binKind: z.nearestBin?.kind ?? '',
        binDistanceM: z.nearestBin?.distanceM ?? 0,
      },
    })),
  };
}