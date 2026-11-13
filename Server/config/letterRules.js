// Letter ke liye: kis issue par kaun si rule clauses quote hongi, aur kisko letter jayega.
// IMPORTANT: ids yahan tabhi bharo jab PDF se asli clause text data/rules/swm-rules.json me aa chuka ho
// aur node scripts/seedRules.js chal chuka ho. Khali array = us issue ke letter me koi rule quote nahi hoga.
export const CLAUSES_BY_ISSUE = {
  waste_dump: [], // e.g. ['15(b)']
  no_bin: [],
  overflowing_bin: [],
  contaminated_water: [],
  open_construction: [],
};

// Kis issue par kin offices ko likhna hai. Pehla = 'to', baaki = 'cc'.
export const OFFICES_BY_ISSUE = {
  waste_dump: ['localBody', 'councillor', 'mla'],
  no_bin: ['localBody', 'councillor', 'mla'],
  overflowing_bin: ['localBody', 'councillor', 'mla'],
  contaminated_water: ['localBody', 'collector', 'mla'],
  open_construction: ['localBody', 'collector', 'mla'],
};

// Area-level letter (scope = ward / assembly / loksabha / district)
export const OFFICES_BY_SCOPE = {
  ward: ['councillor', 'localBody'],
  assembly: ['mla', 'collector'],
  loksabha: ['mp', 'collector'],
  district: ['collector'],
};

// Office -> area ka level jahan us office ka representative milta hai
export const OFFICE_LEVEL = {
  councillor: 'ward',
  mla: 'assembly',
  mp: 'loksabha',
  collector: 'district',
};