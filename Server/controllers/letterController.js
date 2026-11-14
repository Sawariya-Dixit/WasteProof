import { createLetter, getLetter, listRules } from '../services/letterService.js';
import { renderLetterPdf } from '../services/pdfService.js';

export async function postLetter(req, res) {
  const letter = await createLetter(req.user, req.body);
  res.status(201).json({ success: true, data: { letter } });
}

export async function getLetterById(req, res) {
  const letter = await getLetter(req.user, req.valid.params.id);
  res.json({ success: true, data: { letter } });
}

// GET /letters/:id/pdf: letter ki PDF file (sirf apna letter)
export async function getLetterPdf(req, res) {
  const letter = await getLetter(req.user, req.valid.params.id);
  const pdf = await renderLetterPdf(letter);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="junksnap-letter-${letter.id}.pdf"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store',
  });
  res.send(pdf);
}

export async function getRules(req, res) {
  const rules = await listRules();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: { rules }, meta: { count: rules.length } });
}