import { Area } from '../models/Area.js';
import { GeoCache } from '../models/GeoCache.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { GEO_CACHE_TTL_DAYS, GEO_CACHE_DECIMALS } from '../config/defaults.js';

const LEVELS = ['ward', 'assembly', 'loksabha', 'district'];

// 1) Point-in-polygon: lat/lng se ward / assembly / Lok Sabha / district
export async function resolveAreas(lat, lng) {
  const found = await Area.find({
    geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } }, // [lng, lat]!
  })
    .select('level name state code meta isPilot')
    .lean();

  const areas = { ward: null, assembly: null, loksabha: null, district: null };
  for (const a of found) {
    if (LEVELS.includes(a.level)) {
      areas[a.level] = {
        id: a._id,
        name: a.name,
        code: a.code,
        state: a.state,
        isPilot: a.isPilot,
      };
    }
  }
  return areas;
}

// 2) Nominatim ka jawab chhote shape me
export function parseNominatim(json) {
  const a = json?.address;
  if (!a) return null;
  return {
    town: a.city || a.town || a.village || a.suburb || a.hamlet || null,
    district: a.state_district || a.county || null,
    state: a.state || null,
  };
}

// Nominatim policy: max 1 request/second. Saari calls ek line me, beech me 1.1 s ka gap.
let chain = Promise.resolve();
let lastCallAt = 0;
function throttled(fn) {
  const run = chain.then(async () => {
    const wait = Math.max(0, lastCallAt + 1100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run;
}

// Fail hone par null deta hai (request fail nahi hoti, bas town nahi milta). Failure cache nahi hota.
export async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(GEO_CACHE_DECIMALS)},${lng.toFixed(GEO_CACHE_DECIMALS)}`;

  const cached = await GeoCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (cached) return cached.result;

  try {
    const url =
      `${env.NOMINATIM_URL}/reverse?format=jsonv2&addressdetails=1&zoom=14&accept-language=en` +
      `&lat=${lat}&lon=${lng}`;
    const json = await throttled(async () => {
      const res = await fetch(url, {
        headers: { 'User-Agent': env.NOMINATIM_USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
      return res.json();
    });

    const result = parseNominatim(json);
    if (!result) return null; // e.g. {error: "Unable to geocode"}

    await GeoCache.updateOne(
      { key },
      {
        $set: {
          result,
          expiresAt: new Date(Date.now() + GEO_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true },
    );
    return result;
  } catch (err) {
    logger.warn({ err: err.message }, 'reverse geocode failed');
    return null;
  }
}

// 3) GET /geo/resolve ka jawab
export async function resolve(lat, lng) {
  const [areas, place] = await Promise.all([resolveAreas(lat, lng), reverseGeocode(lat, lng)]);
  const anyArea = areas.assembly || areas.loksabha || areas.district || areas.ward;

  return {
    state: anyArea?.state ?? place?.state ?? null,
    district: areas.district?.name ?? place?.district ?? null,
    town: place?.town ?? null,
    assembly: areas.assembly,
    loksabha: areas.loksabha,
    ward: areas.ward, // jab tak reviewed ward map nahi, null rahega
    inPilot: Object.values(areas).some((a) => a?.isPilot),
    geocoded: place !== null, // false = town lookup fail hua, baaki data sahi hai
  };
}
