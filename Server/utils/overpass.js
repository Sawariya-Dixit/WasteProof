import { OVERPASS_RADIUS_M, OVERPASS_MAX_PER_KIND } from '../config/defaults.js';

// Paas ke school, hospital/clinic, paani aur nale (OpenStreetMap, Overpass API)
export function buildOverpassQuery(lat, lng, radius = OVERPASS_RADIUS_M) {
  const a = `(around:${radius},${lat},${lng})`;
  return `[out:json][timeout:20];
(
  nwr${a}["amenity"="school"];
  nwr${a}["amenity"~"^(hospital|clinic)$"];
  nwr${a}["natural"="water"];
  nwr${a}["waterway"~"^(river|stream|canal|drain|ditch)$"];
);
out tags center 60;`;
}

const nameOf = (t) => String(t?.name || t?.['name:en'] || '').trim().slice(0, 80);

// Pure function: Overpass ka jawab -> { schools, hospitals, water, drains } (naam ki list, har ek max 5)
export function parseOverpass(json, max = OVERPASS_MAX_PER_KIND) {
  const out = { schools: [], hospitals: [], water: [], drains: [] };
  const add = (list, tags, fallback) => {
    const label = nameOf(tags) || fallback;
    if (!list.includes(label) && list.length < max) list.push(label);
  };
  for (const el of json?.elements ?? []) {
    const t = el.tags ?? {};
    if (t.amenity === 'school') add(out.schools, t, 'School (unnamed)');
    else if (t.amenity === 'hospital') add(out.hospitals, t, 'Hospital (unnamed)');
    else if (t.amenity === 'clinic') add(out.hospitals, t, 'Clinic (unnamed)');
    else if (t.waterway === 'drain' || t.waterway === 'ditch') add(out.drains, t, 'Drain (unnamed)');
    else if (t.natural === 'water' || ['river', 'stream', 'canal'].includes(t.waterway)) {
      add(out.water, t, 'Water body (unnamed)');
    }
  }
  return out;
}