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


// ---------- Day 13 ----------
export const SITE_MERGE_BAND_M = 40; // 20-40 m ki site tabhi jo photo bhi milti-julti ho
export const SITE_BAND_PHASH_MAX = 14; // is band me pHash distance isse zyada ho to nayi site
export const PHOTO_FLAG_HIDE_AT = 3; // itne alag log flag karein to photo site se hat jati hai
export const PHOTO_FLAG_REASONS = ['face_visible', 'plate_visible', 'not_waste', 'inappropriate', 'other'];
export const PRIVACY_FLAG_REASONS = ['face_visible', 'plate_visible']; // privacy leak: 1 flag par hi hatao
// ---------- Day 13 (cleanup claim + photo flag) ----------
export const CLEANUP_MAX_DISTANCE_M = 100; // after-photo site ke itne paas se li ho
export const CLEANUP_MAX_ACCURACY_M = 50; // GPS accuracy isse kharab ho to claim nahi
export const CLEANUP_ACCEPT_AT = 2; // itne ALAG users ki accepted claims = site 'cleaned'
export const CLEANUP_WINDOW_DAYS = 14; // in claims ko ginne ki window
export const PHOTO_FLAG_MAX_PER_DAY = 10; // ek user din me itne flag kar sakta hai
// ---------- Day 15 ----------
export const SCORE_LEVELS = ['assembly', 'loksabha', 'district']; // ward baad me, jab reviewed map ho
export const BEHAVIOUR_TYPES = ['waste_dump', 'contaminated_water', 'open_construction'];
export const SCORES = {
  cronExpr: '*/15 * * * *', // har 15 min
  includeTest: true, // Day 26 deploy se pehle false kar dena (test sites score me na jayein)
  cityCleanupDays: 7, // overflowing bin itne din me saaf hua to "on time"
  cityMinEligible: 3, // city score ke liye kam se kam itni bins chahiye
  citizenBadDensity: 0.01, // verified sites per km2, jahan citizen score 0 ho jata hai
  binBadDensity: 0.005, // verified no-bin sites per km2, jahan bin score 0 ho jata hai
  repeatReports: 5, // itni reports wali site = repeat spot
  repeatShare: 0.3, // verified sites me se itne hisse repeat spots hon to diagnosis repeat_spot
  lowScore: 50, // isse kam = problem
  mapMaxPoints: 300, // map ke liye polygon itne points tak simplify
    topSites: 5, // area page par itni top sites

};
// ---------- Day 17 (letters) ----------
export const LETTER_SCOPES = ['site', 'ward', 'assembly', 'loksabha', 'district'];
export const LETTER_LANGS = ['en', 'hi'];
export const LETTER_DEDUPE_MINUTES = 10; // same letter itne min me dobara maango to wahi milega (LLM cost / spam)
export const LETTER_PARA_MAX_CHARS = 900; // LLM ka ek paragraph isse bada ho to template
  
// ---------- Day 19 (no-bin zones) ----------
export const NOBIN = {
  radiusM: 1000, // zone ka circle: "mere 1 km me dustbin nahi hai"
  joinM: 500, // itne ke andar ki nayi report usi zone me judti hai
  verifyAt: 1, // 1 alag log = verified (VERIFY_THRESHOLD jaisa)
  maxAccuracyM: 500, // reporter ka GPS isse achha ho
  roundDecimals: 3, // zone ka centre 3 decimal (~110 m) round: reporter ka asli point public nahi
  binSearchM: 1000, // OSM me itni doori tak mapped bin dhundho
  perDay: 5, // ek user din me itni no-bin reports (field test me badha sakte ho)
  maxPerQuery: 200,
  bboxPadDeg: 0.012, // circle ka centre box se thoda bahar ho to bhi circle dikhe
  lockCellDeg: 0.005, // race se bachne ke liye Redis lock grid (~550 m)
  binCacheDays: 30,
};

// ---------- Day 20 (notes + AI summary) ----------
export const NOTE_QUEUE = 'note-summary';
export const NOTES = {
  minChars: 3,
  maxChars: 500,
  perHour: 10, // ek user ghante me itne notes (sab sites mila ke)
  perUserPerSite: 3, // ek user ek site par itne notes
  minForSummary: 3, // itne visible notes ke baad hi AI summary
  maxForSummary: 30, // LLM ko sabse naye itne notes
  summaryDelayMs: 30_000, // naya note aane ke baad itni der ruko (kai notes ek saath summarise)
  summaryChars: 600, // summary ka max size (har bhasha me)
  maxFlagShare: 0.5, // LLM ek baar me isse zyada notes flag kare to flags ignore (prompt-injection se bachav)
  defaultLimit: 20,
  maxLimit: 100,
  concurrency: 1,
};

// ---------- Day 22 (admin) ----------
export const ADMIN = {
  reviewStatuses: ['needs_review', 'community_check'], // admin queue me kaunse status aate hain
  defaultLimit: 20,
  maxLimit: 50,
  failedJobsShown: 20,
  reasonMin: 3,
  reasonMax: 300,
  importMaxFeatures: 2000,
  importBodyLimit: '25mb', // sirf /admin/areas/import par (baaki API par 1mb)
  repsImportMaxChars: 200_000,
  writeLimitPerHour: 200,
};
export const REP_OFFICES = ['councillor', 'mla', 'mp', 'commissioner', 'collector'];
export const REP_LEVELS = {
  mla: ['assembly'],
  mp: ['loksabha'],
  collector: ['district'],
  councillor: ['ward'],
  commissioner: ['ward', 'assembly'],
};
export const AREA_IMPORT_LEVELS = ['assembly', 'loksabha', 'district'];
