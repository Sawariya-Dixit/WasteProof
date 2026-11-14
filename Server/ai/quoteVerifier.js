import { LETTER_PARA_MAX_CHARS } from '../config/defaults.js';

// ---------- chhote helpers ----------
const DEVANAGARI = '०१२३४५६७८९';
const toAsciiDigits = (s) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI.indexOf(d)));

// Text me jitne bhi numbers hain (Hindi digits ko bhi ginta hai)
export function numbersIn(text) {
  return (toAsciiDigits(String(text ?? '')).match(/\d+/g) ?? []).map(Number);
}

const normQuote = (s) =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

// word-by-word compare: shabd same hone chahiye (sirf shuru/aakhir ki punctuation ignore)
const stripEdgePunct = (w) => w.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
const wordsOf = (s) => normQuote(s).split(' ').map(stripEdgePunct).filter(Boolean);

function containsWords(hay, needle) {
  if (!needle.length || needle.length > hay.length) return false;
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

// "..." ya “...” ke andar ka har hissa
export function extractQuotes(text) {
  const out = [];
  for (const m of String(text).matchAll(/\u201C([^\u201D]+)\u201D|"([^"]+)"/g)) {
    out.push((m[1] ?? m[2]).trim());
  }
  return out;
}

// Har quote kisi allowed clause ke text ka lagatar (contiguous) hissa hona chahiye
export function verifyQuotes(text, clauses) {
  const allowed = clauses.map((c) => wordsOf(c.text));
  const bad = [];
  for (const q of extractQuotes(text)) {
    const words = wordsOf(q);
    if (!words.length) continue;
    if (!allowed.some((hay) => containsWords(hay, words))) bad.push(q);
  }
  return { ok: bad.length === 0, bad };
}

// Site verified nahi hai to LLM "verified / confirmed" jaisa kuch nahi likh sakta
const CLAIMS_VERIFIED =
  /\bverif(?:ied|y|ication)\b|\bconfirmed\b|\bauthenticated\b|\bproven\b|सत्यापित|पुष्ट|प्रमाणित/i;
export const claimsVerified = (text) => CLAIMS_VERIFIED.test(text);

// Rule clauses nahi mile to LLM kisi kanoon / rule ka naam nahi le sakta
const LEGAL_WORDS =
  /\b(?:rules?|sections?|clauses?|regulations?|laws?|legal|bylaws?)\b|नियम|अधिनियम|धारा|कानून|कानूनी/i;

const fail = (reason) => ({ ok: false, reason });

// LLM ke likhe hisse ({ opening, request }) ki jaanch. Fail hua to letterService template use karta hai.
// ctx = { clauses, siteVerified, allowedNumbers: Set<number> }
export function verifyLetterProse(parts, ctx) {
  const texts = [parts?.opening, parts?.request];
  for (const t of texts) {
    if (typeof t !== 'string' || !t.trim()) return fail('empty');
    if (t.length > LETTER_PARA_MAX_CHARS) return fail('too_long');
  }
  const all = texts.join('\n');

  if (/[*#`<>{}]|https?:|www\.|@/.test(all)) return fail('markup');

  const openCurly = (all.match(/\u201C/g) ?? []).length;
  const closeCurly = (all.match(/\u201D/g) ?? []).length;
  const straight = (all.match(/"/g) ?? []).length;
  if (openCurly !== closeCurly || straight % 2 !== 0) return fail('unbalanced_quotes');

  if (!verifyQuotes(all, ctx.clauses).ok) return fail('quote_mismatch');
  if (!ctx.siteVerified && claimsVerified(all)) return fail('false_verified');
  if (!ctx.clauses.length && LEGAL_WORDS.test(all)) return fail('invented_rule');

  const unknown = numbersIn(all).filter((n) => !ctx.allowedNumbers.has(n));
  if (unknown.length) return fail('invented_number');

  return { ok: true };
}