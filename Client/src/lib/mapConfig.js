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
  unverified: '#f59e0b', // amber: abhi 10 log confirm nahi kar paye
  verified: '#dc2626', // red: 10 logon ne confirm kiya
  cleaned: '#16a34a', // green: saaf ho gaya
};
