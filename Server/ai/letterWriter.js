import { generateTextJson } from './llmClient.js';
import { ISSUE_LABEL } from '../services/letterTemplates.js';

const LANG_NAME = { en: 'English', hi: 'Hindi (Devanagari script)' };

// LLM sirf do hisse likhta hai: opening aur request. Baaki (status, evidence, rule clauses) server banata hai.
// Likhne ke baad quoteVerifier.verifyLetterProse har cheez jaanchta hai.
export async function writeLetterProse({ lang, issueType, facts, clauses }) {
  const ruleNames = [...new Set(clauses.map((c) => c.ruleName))];

  const system = [
    'You write two short parts of a formal complaint letter from an Indian resident to a civic authority.',
    `Write in ${LANG_NAME[lang]}. Tone: polite, firm, factual.`,
    'Use ONLY the facts in the JSON the user sends. Never invent facts, numbers, dates, names, places or laws.',
    'Do not use any quotation marks. Do not use markdown, lists, links, emails or phone numbers.',
    'Do not write a greeting, a sign-off or a subject line. Do not mention dates.',
    'Do not say anything is verified, confirmed, authenticated or proven; the letter has a separate evidence section for that.',
    ruleNames.length
      ? `You may refer to these rules by name only: ${ruleNames.join('; ')}. Never copy their text and never mention clause or section numbers.`
      : 'Do not mention any law, rule, section or regulation.',
    'Return JSON only, in this shape: {"opening": "...", "request": "..."}',
    '"opening": 2 to 3 sentences describing the problem and where it is.',
    '"request": 1 to 2 sentences asking the authority to inspect, take the specific action needed, and reply in writing.',
  ].join('\n');

  // Personal data kuch nahi jata: sirf issue, jagah ka naam aur counts
  const llmFacts = {
    scope: facts.scope === 'site' ? 'one site' : `the whole ${facts.scope} area`,
    issue: ISSUE_LABEL.en[issueType],
    place: facts.placeText || null,
    area: facts.areaName ?? null,
    reportsFiled: facts.reports ?? null,
    sitesReported: facts.totalSites ?? null,
  };

  const out = await generateTextJson({
    system,
    prompt: `Facts (JSON):\n${JSON.stringify(llmFacts)}\n\nReturn the JSON now.`,
  });
  return {
    opening: String(out?.opening ?? '').trim(),
    request: String(out?.request ?? '').trim(),
  };
}