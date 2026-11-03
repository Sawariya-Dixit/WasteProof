// Groq judge ka prompt aur jawab ko saaf karne wala pure code (network ya env nahi, isliye test ho jata hai)
const ANSWERS = new Set(['yes', 'no', 'uncertain']);
const KEYS = ['garbage', 'bin', 'overflowing', 'water', 'construction', 'usable_photo'];

// Prompt v1. Photo me chehre aur number plate pehle se blur hain.
export const buildPrompt = (type) => `You are a strict photo checker for a civic waste-reporting app in India.
The photo was taken outdoors by a resident. Faces and number plates are already blurred, ignore the blur.
The resident says the photo shows this problem: "${type}".

Answer each question with exactly one of: "yes", "no", "uncertain".
- garbage: is there a heap or scatter of rubbish / litter / dumped waste clearly visible?
- bin: is a waste bin, dumpster or garbage container visible?
- overflowing: is a bin or container overflowing, or broken, with waste spilling out?
- water: is there dirty, sewage-like or stagnant contaminated water visible?
- construction: is there open construction work, rubble or building debris visible?
- usable_photo: is this a real, clear photo of a place (not a screenshot, a photo of a screen, a selfie, an indoor scene, or too dark/blurry to judge)?

Reply with JSON only, in this exact shape:
{"garbage":"..","bin":"..","overflowing":"..","water":"..","construction":"..","usable_photo":"..","reason":"max 15 words"}`;

const norm = (v) => {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return ANSWERS.has(s) ? s : 'uncertain'; // samajh na aaye to uncertain, kabhi yes nahi
};

// Pure function: model ke JSON -> { verdict, attributes, reason }. Bina network ke test hoti hai.
export function normalizeLlmJudge(raw, type) {
  const a = {};
  for (const k of KEYS) a[k] = norm(raw?.[k]);

  let verdict;
  switch (type) {
    case 'overflowing_bin':
      if (a.overflowing === 'yes') verdict = 'yes';
      else if (a.overflowing === 'no' && a.bin === 'no' && a.garbage === 'no') verdict = 'no';
      else if (a.overflowing === 'no') verdict = a.bin === 'yes' ? 'no' : 'uncertain';
      else verdict = 'uncertain';
      break;
    case 'contaminated_water':
      verdict = a.water;
      break;
    case 'open_construction':
      verdict = a.construction;
      break;
    default: // waste_dump, no_bin
      verdict = a.garbage;
  }
  // Photo hi kaam ki nahi (screenshot, andhera) to 'yes' pakka nahi maan sakte
  if (a.usable_photo === 'no' && verdict === 'yes') verdict = 'uncertain';

  return { verdict, attributes: a, reason: String(raw?.reason ?? '').slice(0, 160) };
}
