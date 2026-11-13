export const EMPTY_FC = { type: 'FeatureCollection', features: [] };

export const SCORE_COLORS = {
  none: '#94a3b8', // score withheld
  bad: '#dc2626', // 0-39
  mid: '#f59e0b', // 40-69
  good: '#16a34a', // 70+
};

export function scoreColor(score) {
  if (score == null) return SCORE_COLORS.none;
  if (score < 40) return SCORE_COLORS.bad;
  if (score < 70) return SCORE_COLORS.mid;
  return SCORE_COLORS.good;
}

// Saare polygons ka bounding box: [[w, s], [e, n]] ya null
export function geojsonBounds(fc) {
  let w = Infinity,
    s = Infinity,
    e = -Infinity,
    n = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      w = Math.min(w, c[0]);
      e = Math.max(e, c[0]);
      s = Math.min(s, c[1]);
      n = Math.max(n, c[1]);
    } else {
      c.forEach(walk);
    }
  };
  fc.features.forEach((f) => walk(f.geometry.coordinates));
  return Number.isFinite(w) ? [[w, s], [e, n]] : null;
}