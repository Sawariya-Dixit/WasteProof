// Notes me personal data rokne ke liye (phone, email, link, number plate). Pure functions, DB nahi.
const DEVANAGARI = '०१२३४५६७८९';
const toAsciiDigits = (s) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI.indexOf(d)));

// HTML tags, control characters aur extra spaces hatao. Note ek hi line ban jata hai.
export function cleanNoteText(raw) {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL = /https?:\/\/|www\.|\b[\w-]+\.(?:com|in|org|net|co|io|me|ly|app)\b/i;
const HANDLE = /(?:^|\s)@\w{3,}/;
const PLATE = /\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}\b/i; // jaise MP 09 AB 1234

// Return: reasons ki list. Khaali list = theek.
export function findPii(text) {
  const ascii = toAsciiDigits(String(text ?? ''));
  const reasons = [];
  if (EMAIL.test(ascii)) reasons.push('email');
  // email ka domain (gmail.com) link na ginein
  if (URL.test(ascii.replace(new RegExp(EMAIL, 'g'), ' '))) reasons.push('url');
  if (HANDLE.test(ascii)) reasons.push('handle');
  // 10+ digit lagatar (spaces / dash / dot ke saath bhi): phone, Aadhaar
  const squashed = ascii.replace(/(?<=\d)[\s\-.()]+(?=\d)/g, '');
  if (/\+?\d{10,}/.test(squashed)) reasons.push('phone');
  if (PLATE.test(ascii)) reasons.push('plate');
  return reasons;
}