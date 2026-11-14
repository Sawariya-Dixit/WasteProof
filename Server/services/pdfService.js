import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { AppError } from '../utils/AppError.js';

// Fonts Server/assets/fonts me hote hain (npm run fonts se aate hain).
// Devanagari font me A-Z nahi hota, isliye har run ke liye script dekh ke font badalte hain.
const FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts');
export const FONT_FILES = {
  lat: 'NotoSans-Regular.ttf',
  latB: 'NotoSans-Bold.ttf',
  dev: 'NotoSansDevanagari-Regular.ttf',
  devB: 'NotoSansDevanagari-Bold.ttf',
};

const PAGE = { margin: 56, size: 'A4' };
const DEV_RUN = /([\u0900-\u097F\u200C\u200D]+)/; // Devanagari ke saath ZWJ/ZWNJ (conjuncts ke liye)
const IS_DEV = /^[\u0900-\u097F\u200C\u200D]/;
const SUBJECT_PREFIX = /^(Subject:|विषय:)/;

function fontPaths() {
  const paths = Object.fromEntries(
    Object.entries(FONT_FILES).map(([k, f]) => [k, path.join(FONT_DIR, f)]),
  );
  const missing = Object.values(paths).filter((p) => !fs.existsSync(p));
  if (missing.length) {
    throw new AppError(
      'PDF ke fonts server par nahi mile. Server folder me "npm run fonts" chalao.',
      503,
      'PDF_FONTS_MISSING',
    );
  }
  return paths;
}

// Ek line likho: Devanagari aur Latin hisse alag font se, par ek hi line me (wrap sahi chalta hai)
function writeLine(doc, text, { x, width, bold = false, size = 11, color = '#111111', lineGap = 3 }) {
  const parts = text.split(DEV_RUN).filter(Boolean);
  doc.fontSize(size).fillColor(color);
  const y = doc.y;
  parts.forEach((part, i) => {
    const dev = IS_DEV.test(part);
    doc.font(dev ? (bold ? 'devB' : 'dev') : bold ? 'latB' : 'lat');
    const last = i === parts.length - 1;
    if (i === 0) doc.text(part, x, y, { width, lineGap, continued: !last });
    else doc.text(part, { width, lineGap, continued: !last });
  });
}

// letter = { subject, body }. Body plain text hai (date, To, Subject, paragraphs, "- " bullets, clauses).
export function renderLetterPdf(letter) {
  const paths = fontPaths();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      info: { Title: letter.subject, Producer: 'JunkSnap' },
    });
    for (const [name, p] of Object.entries(paths)) doc.registerFont(name, p);

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    try {
      for (const line of letter.body.split('\n')) {
        if (line.trim() === '') {
          doc.moveDown(0.6);
          continue;
        }
        if (line.startsWith('- ')) {
          // bullet: chhota gol + hanging indent
          const y = doc.y;
          doc.font('lat').fontSize(11).fillColor('#111111').text('•', left + 4, y, { width: 10 });
          doc.y = y;
          writeLine(doc, line.slice(2), { x: left + 18, width: width - 18 });
        } else if (line.startsWith('— ')) {
          writeLine(doc, line, { x: left + 14, width: width - 14, size: 9.5, color: '#555555' }); // rule ka hawala
        } else if (line.startsWith('"')) {
          writeLine(doc, line, { x: left + 14, width: width - 14 }); // rule ka quote
        } else {
          writeLine(doc, line, { x: left, width, bold: SUBJECT_PREFIX.test(line) });
        }
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}