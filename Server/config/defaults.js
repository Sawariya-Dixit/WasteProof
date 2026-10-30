export const REPORT_TYPES = [
  'waste_dump',
  'no_bin',
  'overflowing_bin',
  'contaminated_water',
  'open_construction',
];

export const SITE_STATUSES = ['unverified', 'verified', 'cleaned', 'hidden'];
export const PUBLIC_SITE_STATUSES = ['unverified', 'verified', 'cleaned']; // hidden public ko nahi dikhta

export const VERIFY_THRESHOLD = 10; // 10 distinct backers = verified
export const MAX_SITES_PER_QUERY = 500;
export const MAX_BBOX_SPAN_DEG = 5; // bahut bada map box reject
export const INDIA_BOUNDS = { minLat: 6.0, maxLat: 37.6, minLng: 68.0, maxLng: 97.5 };
export const GEO_CACHE_TTL_DAYS = 30;
export const GEO_CACHE_DECIMALS = 3; // 3 decimal = lagbhag 110 m
export const REPORT_MAX_AGE_MS = 10 * 60 * 1000; // capturedAt 10 min se purana nahi
export const CLOCK_SKEW_MS = 60 * 1000; // phone ki ghadi thodi aage ho to chalega
export const MAX_ACCURACY_M = 500;
export const SNAPS_PER_HOUR = 20; // field-test ke din badha sakte ho
export const NOTE_MAX_CHARS = 300;
export const REPORT_QUEUE = 'report-pipeline'; // BullMQ queue ka naam
export const REPORT_JOB_ATTEMPTS = 3; // 3 try, phir needs_review
export const REPORT_JOB_BACKOFF_MS = 5000; // retry se pehle 5s, 10s...
export const WORKER_CONCURRENCY = 3; // ek saath kitne jobs
export const REQUEUE_AFTER_MS = 10 * 60 * 1000;
export const REQUEUE_EVERY_MS = 5 * 60 * 1000;
