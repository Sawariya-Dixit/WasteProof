// Letter ke liye: kis issue par kaun si rule clauses quote hongi, aur kisko letter jayega.
// IMPORTANT: ids yahan tabhi bharo jab PDF se asli clause text data/rules/swm-rules.json me aa chuka ho
// aur node scripts/seedRules.js chal chuka ho. Khali array = us issue ke letter me koi rule quote nahi hoga.
export const CLAUSES_BY_ISSUE = {
  waste_dump: ['5(1)(f)', '39(2)(vii)'],
  overflowing_bin: ['39(2)(x)', '39(2)(vii)'],
  no_bin: ['39(42)', '39(4)'],
  contaminated_water: ['39(2)(ix)', '24(1)(a)'],
  open_construction: ['9(1)(d)', '17(1)'],
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