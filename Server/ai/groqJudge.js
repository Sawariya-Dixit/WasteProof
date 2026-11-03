import { generateJson } from './llmClient.js';
import { buildPrompt, normalizeLlmJudge } from './groqPrompt.js';
import { env } from '../config/env.js';

export { buildPrompt, normalizeLlmJudge };

// jpeg = blurred copy (chehre/plates pehle se blur). Return: { verdict, attributes, reason, model }
export async function judgeWithGroq(jpeg, type) {
  const raw = await generateJson({ prompt: buildPrompt(type), image: jpeg });
  return { ...normalizeLlmJudge(raw, type), model: env.GROQ_MODEL };
}
