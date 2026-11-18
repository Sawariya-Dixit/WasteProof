export const PRESETS = {
  assembly: { name: 'AC_NAME', no: 'AC_NO', state: 'ST_NAME', meta: ['DIST_NAME', 'PC_NAME'] },
  loksabha: { name: 'pc_name', no: 'pc_no', state: 'st_name', meta: ['pc_category'] },
  district: { name: 'DISTRICT', no: 'censuscode', state: 'ST_NM', meta: [] },
};

export const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const tidy = (s) => {
  const t = String(s).trim().replace(/\s+/g, ' ');
  return t === t.toUpperCase()
    ? t
        .toLowerCase()
        .replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase())
        .replace(/\((sc|st)\)/gi, (m) => m.toUpperCase())
    : t;
};

function cleanRing(ring) {
  const out = [];
  for (const p of ring) {
    const pt = [p[0], p[1]];
    const last = out[out.length - 1];
    if (!last || last[0] !== pt[0] || last[1] !== pt[1]) out.push(pt);
  }
  const f = out[0];
  const l = out[out.length - 1];
  if (f && (f[0] !== l[0] || f[1] !== l[1])) out.push([...f]);
  return out;
}

export function cleanGeometry(g) {
  if (!g || !['Polygon', 'MultiPolygon'].includes(g.type)) {
    throw new Error(`geometry ${g?.type ?? 'missing'} chalega nahi (Polygon/MultiPolygon chahiye)`);
  }
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const cleaned = polys
    .map((rings) => rings.map(cleanRing).filter((r) => r.length >= 4))
    .filter((rings) => rings.length > 0);
  if (!cleaned.length) throw new Error('geometry khali ya bahut chhoti hai');
  const [x, y] = cleaned[0][0][0];
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    throw new Error('coordinates lat/lng nahi lag rahe (projected CRS?). mapshaper me -proj wgs84 lagao');
  }
  return cleaned.length === 1 && g.type === 'Polygon'
    ? { type: 'Polygon', coordinates: cleaned[0] }
    : { type: 'MultiPolygon', coordinates: cleaned };
}

// FeatureCollection -> { docs: [Area fields], bad: ['feature #3: ...'] }
export function parseFeatures(data, level) {
  const preset = PRESETS[level];
  if (!preset) throw new Error(`level galat: ${level}`);
  const docs = [];
  const bad = [];
  for (const [i, f] of (data?.features ?? []).entries()) {
    const p = f?.properties || {};
    try {
      if (p[preset.name] == null || p[preset.no] == null || p[preset.state] == null) {
        throw new Error(
          `properties me ${preset.name}/${preset.no}/${preset.state} chahiye. Mili: ${Object.keys(p).join(', ')}`,
        );
      }
      const state = tidy(p[preset.state]);
      docs.push({
        level,
        name: tidy(p[preset.name]),
        state,
        code: `${slug(state)}-${p[preset.no]}`,
        geometry: cleanGeometry(f.geometry),
        isPilot: false,
        meta: Object.fromEntries(
          preset.meta.filter((k) => p[k] != null && p[k] !== '').map((k) => [k, tidy(p[k])]),
        ),
      });
    } catch (e) {
      bad.push(`feature #${i}: ${e.message}`);
    }
  }
  return { docs, bad };
}