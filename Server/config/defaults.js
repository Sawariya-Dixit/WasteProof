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
export const PIPELINE_STEP_NAMES = ['moderate', 'blur', 'checks', 'verify', 'merge', 'locate'];
export const MAX_IMAGE_DIM = 1600; // worker isi size par kaam karta hai
export const FACE_BLUR = { minConfidence: 0.25, pad: 0.4, sigma: 30 }; // kam confidence = zyada blur
export const PLATE_BLUR_PAD = 0.5; // number plate ke aas-paas zyada blur (shak ho to zyada)
export const MIN_BLUR_BOX_PX = 32; // bahut chhote (door ki) box ko itna bada kar do

// Rekognition (ai/rekognitionScan.js)
export const REKOGNITION = {
  // Sirf ye top-level categories reject karti hain. Alcohol / Drugs & Tobacco par reject NAHI,
  // warna kachre me padi bottle ya cigarette packet wali photo galat reject ho jayegi
  blockedModeration: [
    'Explicit',
    'Explicit Nudity',
    'Non-Explicit Nudity of Intimate parts and Kissing',
    'Violence',
    'Visually Disturbing',
  ],
  moderationMinConfidence: 70, // isse upar ho tabhi unsafe maano
  moderationFetchConfidence: 50, // AWS se itna low confidence tak maango
  labelsMinConfidence: 50,
  maxLabels: 40,
};

// ---------- Day 10 ----------
export const SITE_MERGE_RADIUS_M = 20; // 20 m ke andar same type = usi site me
export const SITE_LOCK_CELL_DEG = 0.001; // lock grid, lagbhag 110 m
export const SITE_LOCK_TTL_MS = 10_000;
export const SITE_LOCK_RETRIES = 20;
export const SITE_LOCK_RETRY_MS = 250;
export const PHASH_MAX_DISTANCE = 5; // 64 bit me se itne bit tak alag ho to bhi duplicate
export const PHASH_LOOKBACK_DAYS = 30;
export const PHASH_MAX_COMPARE = 1000;
// Waste judge (Rekognition labels). Label names AWS ke hain, apni photos dekh ke badal sakte ho
export const JUDGE = {
  strongConf: 70,
  weakConf: 60,
  minConf: 50,
  garbage: ['Garbage', 'Trash', 'Litter', 'Rubbish', 'Junk', 'Waste', 'Dump', 'Landfill', 'Pollution'],
  garbageWeak: ['Plastic Bag', 'Plastic', 'Bottle', 'Cardboard', 'Debris', 'Paper', 'Bag', 'Tire'],
  bin: ['Trash Can', 'Bin', 'Dumpster', 'Tin'],
  water: ['Sewage', 'Puddle', 'Flood', 'Drain', 'Sewer', 'Water', 'Pond'],
  construction: ['Construction', 'Construction Site', 'Rubble', 'Scaffolding', 'Excavator', 'Bulldozer', 'Brick'],
};

// ---------- Day 11 ----------
// Judge ke jawab (yes/no/uncertain) ko probability me badalna aur dono judges ko milana (ai/decision.js)
export const VERIFY = {
  weights: { labels: 0.4, llm: 0.6 }, // sirf jo judge available ho uske weights normalise hote hain
  verdictProb: { yes: 0.9, uncertain: 0.5, no: 0.1 },
  rejectBelow: 0.5, // probability isse kam aur kisi judge ne 'yes' nahi bola = reject
  detectorMin: 0.5, // (Day 23 YOLO) detector pakka ho to reject ki jagah community_check
};
export const LLM_JUDGE_TIMEOUT_MS = 20_000;
export const LLM_IMAGE_WIDTH = 1024; // Groq ko chhoti copy bhejo (tez + sasti)
export const REPORTER_CONFIRM_REASON = 'uncertain'; // pipeline.rejectReason me jo likha jata hai


// ---------- Day 12 ----------
export const HIDE_NO_MARGIN = 3; // 'no' votes backers se itne ya zyada ho jayein to site hidden
export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const OVERPASS_RADIUS_M = 300;
export const OVERPASS_MAX_PER_KIND = 5;
export const OVERPASS_TIMEOUT_MS = 25_000;
export const NEARBY_CACHE_TTL_DAYS = 30;
