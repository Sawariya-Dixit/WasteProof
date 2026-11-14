import { NobinZone } from '../models/NobinZone.js';
import { GeoCache } from '../models/GeoCache.js';
import { env } from '../config/env.js';
import { NOBIN, OVERPASS_URL, OVERPASS_TIMEOUT_MS, GEO_CACHE_DECIMALS } from '../config/defaults.js';
import { buildBinQuery, parseNearestBin } from '../utils/binQuery.js';

// Overpass ki fair-use: saari calls ek line me, beech me 1 s ka gap (locateService jaisa)
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

// Return: { found:false } ya { found:true, name, kind, distanceM }. Fail hone par throw (caller sambhalta hai).
export async function findNearestBin(lat, lng) {
  const key = `bin:${lat.toFixed(GEO_CACHE_DECIMALS)},${lng.toFixed(GEO_CACHE_DECIMALS)}`;
  const cached = await GeoCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (cached) return cached.result;

  const json = await throttled(async () => {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': env.NOMINATIM_USER_AGENT,
      },
      body: `data=${encodeURIComponent(buildBinQuery(lat, lng))}`,
      signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    return res.json();
  });
  // Overpass overload par 200 ke saath khaali elements aur remark deta hai: ise "koi bin nahi" mat maano
  if (/runtime error|timed out/i.test(json?.remark ?? '')) throw new Error(`Overpass: ${json.remark}`);

  const best = parseNearestBin(json, lat, lng);
  const result = best ? { found: true, ...best } : { found: false };
  await GeoCache.updateOne(
    { key },
    { $set: { result, expiresAt: new Date(Date.now() + NOBIN.binCacheDays * 24 * 60 * 60 * 1000) } },
    { upsert: true },
  );
  return result;
}

// Zone me nearestBin bharo. Idempotent: checkedAt lag gaya to dobara kuch nahi.
// Overpass fail ho to checkedAt nahi lagta, agli report judne par dobara koshish hoti hai.
export async function refreshZoneBin(zoneId, log) {
  const zone = await NobinZone.findById(zoneId).select('center nearestBin');
  if (!zone || zone.nearestBin?.checkedAt) return null;
  const [lng, lat] = zone.center.coordinates; // zone ka (rounded) centre, reporter ka asli point nahi
  try {
    const r = await findNearestBin(lat, lng);
    await NobinZone.updateOne(
      { _id: zoneId },
      {
        $set: {
          nearestBin: {
            checkedAt: new Date(),
            found: r.found,
            name: r.name ?? null,
            kind: r.kind ?? null,
            distanceM: r.distanceM ?? null,
          },
        },
      },
    );
    return r;
  } catch (err) {
    log?.warn({ err: err.message }, 'nearest bin: Overpass fail, baad me dobara try hoga');
    return null;
  }
}