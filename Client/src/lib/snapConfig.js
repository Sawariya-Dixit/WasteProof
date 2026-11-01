export const MAX_GPS_ACCURACY_M = 50; // isse kharab accuracy par submit block
export const MAX_IMAGE_DIM = 1600; // photo ki lambi side max 1600 px
export const JPEG_QUALITY = 0.8;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Server ke config/defaults.js ke INDIA_BOUNDS se match rakho
const INDIA = { minLat: 6.0, maxLat: 37.6, minLng: 68.0, maxLng: 97.5 };
export const inIndia = (lat, lng) =>
  lat >= INDIA.minLat && lat <= INDIA.maxLat && lng >= INDIA.minLng && lng <= INDIA.maxLng;
export const REPORT_TYPES = [
  'waste_dump',
  'no_bin',
  'overflowing_bin',
  'contaminated_water',
  'open_construction',
];
export const NOTE_MAX_CHARS = 300;