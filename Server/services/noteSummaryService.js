import { Note } from '../models/Note.js';
import { Site } from '../models/Site.js';
import { env } from '../config/env.js';
import { NOTES } from '../config/defaults.js';
import { generateTextJson } from '../ai/llmClient.js';
import { buildSummaryRequest, checkSummaryOutput } from '../ai/noteSummary.js';

// Ek site ke notes ka AI summary + moderation, ek hi LLM call me. Worker se chalta hai.
// Idempotent: kitni baar bhi chalao, notes ke hisaab se wahi natija. Fail hone par purani summary waisi hi rehti hai.
export async function summarizeSite(siteId, log) {
  if (!env.GROQ_API_KEY) {
    log?.warn('GROQ_API_KEY nahi hai, notes summary skip');
    return { skipped: 'no_key' };
  }

  const site = await Site.findById(siteId).select('_id').lean();
  if (!site) return { skipped: 'no_site' };

  // Sabse naye notes, purane se naya order me. Pehle se flagged notes LLM ko nahi jaate.
  const recent = await Note.find({ siteId, status: 'visible' })
    .sort({ createdAt: -1 })
    .limit(NOTES.maxForSummary)
    .select('text')
    .lean();
  const notes = recent.reverse();

  if (notes.length < NOTES.minForSummary) {
    await Site.updateOne({ _id: siteId }, { $unset: { noteSummary: '' } });
    return { notes: notes.length, summary: false };
  }

  const { system, prompt } = buildSummaryRequest(notes.map((n) => n.text)); // sirf text, user id nahi
  const out = await generateTextJson({ system, prompt, maxTokens: 1000 });
  const check = checkSummaryOutput(out, notes.length);

  if (!check.ok) {
    // Galat output: kuch mat badlo. Throw karne se job dobara try hota hai.
    log?.warn({ reason: check.reason }, 'note summary output check fail');
    throw new Error(`note summary check fail: ${check.reason}`);
  }

  // Flagged notes: likhne wale ko dikhte rahenge, baaki sab se chhup jate hain
  for (const i of check.flaggedIdx) {
    await Note.updateOne({ _id: notes[i]._id, status: 'visible' }, { $set: { status: 'flagged' } });
  }

  const used = notes.length - check.flaggedIdx.length;
  if (check.en) {
    await Site.updateOne(
      { _id: siteId },
      {
        $set: {
          noteSummary: {
            en: check.en,
            hi: check.hi,
            noteCount: used,
            generatedAt: new Date(),
            llmModel: env.GROQ_MODEL,
          },
        },
      },
    );
  } else {
    await Site.updateOne({ _id: siteId }, { $unset: { noteSummary: '' } });
  }
  return { notes: notes.length, flagged: check.flaggedIdx.length, summary: Boolean(check.en) };
}