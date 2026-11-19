// Khategaon (Dewas, MP). [lng, lat]. MapLibre me hamesha [lng, lat] hota hai.
export const KHATEGAON = { center: [76.9132, 22.5933], zoom: 13 };

// Server ki limit (config/defaults.js: MAX_BBOX_SPAN_DEG) se match honi chahiye
export const MAX_BBOX_SPAN_DEG = 5;

// Free OpenStreetMap tiles. (Production me heavy traffic ho to apna tile provider lo.)
export const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Pin ke rang (legend me bhi yahi use hote hain)
export const STATUS_COLORS = {
  unverified: '#f59e0b', // amber: abhi itne log confirm nahi kar paye
  verified: '#dc2626', // red: zaroori logon ne confirm kiya
  cleaned: '#16a34a', // green: saaf ho gaya
};
// Ye numbers server ke .env se aate hain (GET /api/v1/config), yahan badalne ki zaroorat nahi.
// 'let' export = live binding: app start par lib/appConfig.js inhe server wali value se badal deta hai.
// Default server ke default jaise hi rakho (5 aur 10), taaki config na mile to bhi theek chale.
export let VERIFY_THRESHOLD = 5; // site / no-bin zone itne logon se verified
export let AREA_MIN_VERIFIED = 10; // area score aur area letter ke liye itni verified sites

export function setThresholds({ verifyThreshold, areaMinVerified }) {
  if (Number.isInteger(verifyThreshold) && verifyThreshold > 0) VERIFY_THRESHOLD = verifyThreshold;
  if (Number.isInteger(areaMinVerified) && areaMinVerified > 0) AREA_MIN_VERIFIED = areaMinVerified;
}

// Pins paas-paas hon to cluster (gol number wala) ban jata hai
export const CLUSTER = { maxZoom: 15, radius: 50 };