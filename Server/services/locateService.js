import { Site } from '../models/Site.js';
import { LocalBody } from '../models/LocalBody.js';
import { GeoCache } from '../models/GeoCache.js';
import { env } from '../config/env.js';
import { OVERPASS_URL, OVERPASS_TIMEOUT_MS, NEARBY_CACHE_TTL_DAYS, GEO_CACHE_DECIMALS } from '../config/defaults.js';
import { resolveAreas } from './geoService.js';
import { buildOverpassQuery, parseOverpass } from '../utils/overpass.js';

const LEVELS = ['assembly', 'district', 'loksabha', 'ward'];

// Overpass ki fair-use: saari calls ek line me, beech me 1 s ka gap
let chain = Promise.resolve();
let lastCallAt = 0;
function throttled(fn) {
  const run = chain.then(async () => {
    const wait = Math.max(0, lastCallAt + 1000 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run;
}

// Fail hone par throw karta hai (caller decide karta hai). Safal result Mongo me cache hota hai.
export async function fetchNearby(lat, lng) {
  const key = `overpass:${lat.toFixed(GEO_CACHE_DECIMALS)},${lng.toFixed(GEO_CACHE_DECIMALS)}`;
  const cached = await GeoCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (cached) return cached.result;

  const json = await throttled(async () => {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': env.NOMINATIM_USER_AGENT,
      },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lng))}`,
      signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    return res.json();
  });
  // Overpass overload par 200 ke saath khaali elements aur remark deta hai
  if (/runtime error|timed out/i.test(json?.remark ?? '')) throw new Error(`Overpass: ${json.remark}`);

  const result = parseOverpass(json);
  await GeoCache.updateOne(
    { key },
    {
      $set: {
        result,
        expiresAt: new Date(Date.now() + NEARBY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true },
  );
  return result;
}

// Site ke ward / assembly / Lok Sabha / district, local body aur paas ki jagah Site me save karo.
// Idempotent: locatedAt lag gaya to dobara kuch nahi. Overpass fail ho to areas phir bhi save hote hain,
// locatedAt nahi lagta, isliye us site par agli report jud-ne par dobara koshish hoti hai.
export async function locateSite(siteId, log) {
  const site = await Site.findById(siteId).select('location locatedAt');
  if (!site) throw new Error('Site nahi mili, locate nahi kar sakte');
  if (site.locatedAt) return { siteId: String(siteId), skipped: true };

  const [lng, lat] = site.location.coordinates;
  const areas = await resolveAreas(lat, lng);

  const set = {};
  const found = [];
  for (const level of LEVELS) {
    if (areas[level]) {
      set[`areaIds.${level}`] = areas[level].id;
      found.push(level);
    }
  }

  // Local body: assembly se pehle, phir district se milao
  const ids = LEVELS.map((l) => areas[l]?.id).filter(Boolean);
  if (ids.length) {
    const bodies = await LocalBody.find({ areaIds: { $in: ids } })
      .select('_id areaIds')
      .lean();
    const best = ids
      .map((id) => bodies.find((b) => b.areaIds.some((x) => String(x) === String(id))))
      .find(Boolean);
    if (best) set.localBodyId = best._id;
  }

  let nearbyCounts = null;
  try {
    const nearby = await fetchNearby(lat, lng);
    set.nearby = nearby;
    set.locatedAt = new Date();
    nearbyCounts = Object.fromEntries(Object.entries(nearby).map(([k, v]) => [k, v.length]));
  } catch (err) {
    log?.warn({ err: err.message }, 'Overpass fail, nearby baad me dobara try hoga');
  }

  if (Object.keys(set).length) await Site.updateOne({ _id: siteId }, { $set: set });
  return { siteId: String(siteId), areas: found, localBody: !!set.localBodyId, nearby: nearbyCounts };
}