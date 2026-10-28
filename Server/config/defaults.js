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
