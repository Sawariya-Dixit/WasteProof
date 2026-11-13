const R = 6371; // km
const rad = (d) => (d * Math.PI) / 180;

function ringAreaKm2(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    s += rad(lng2 - lng1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((s * R * R) / 2);
}

const polygonsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

export function areaKm2(geometry) {
  let total = 0;
  for (const rings of polygonsOf(geometry)) {
    total += ringAreaKm2(rings[0]) - rings.slice(1).reduce((x, h) => x + ringAreaKm2(h), 0);
  }
  return total;
}

function planarCentroid(ring) {
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-12) {
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

// Sabse bade polygon ka centroid [lng, lat]
export function centroidOf(geometry) {
  let best = null;
  let bestA = -1;
  for (const rings of polygonsOf(geometry)) {
    const a = ringAreaKm2(rings[0]);
    if (a > bestA) {
      bestA = a;
      best = rings[0];
    }
  }
  const [lng, lat] = planarCentroid(best);
  return [Number(lng.toFixed(5)), Number(lat.toFixed(5))];
}

function decimate(ring, maxPts) {
  if (ring.length <= maxPts) return ring;
  const step = Math.ceil(ring.length / maxPts);
  const out = ring.filter((_, i) => i % step === 0);
  const f = out[0];
  const l = out[out.length - 1];
  if (f[0] !== l[0] || f[1] !== l[1]) out.push([...f]);
  return out.length >= 4 ? out : ring;
}

// Map par bhejne ke liye polygon halka karo (shape lagbhag wahi rehta hai)
export function simplifyGeometry(geometry, maxPts = 300) {
  const polys = polygonsOf(geometry).map((rings) => rings.map((r) => decimate(r, maxPts)));
  return geometry.type === 'Polygon'
    ? { type: 'Polygon', coordinates: polys[0] }
    : { type: 'MultiPolygon', coordinates: polys };
}