import { generateJson } from './llmClient.js';
import { buildPrompt, normalizeLlmJudge, PROMPT_VERSION } from './groqPrompt.js';
import { env } from '../config/env.js';

export { buildPrompt, normalizeLlmJudge, PROMPT_VERSION };

const RETRY_WAIT_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 429, 5xx ya timeout ek baar dobara try. Baaki errors (key galat, JSON kharab) turant.
const isTransient = (err) =>
  err?.status === 429 || (err?.status ?? 0) >= 500 || err?.name === 'TimeoutError' || err?.name === 'AbortError';

export async function judgeWithGroq(jpeg, type) {
  const prompt = buildPrompt(type);
  let raw;
  try {
    raw = await generateJson({ prompt, image: jpeg });
  } catch (err) {
    if (!isTransient(err)) throw err;
    await sleep(RETRY_WAIT_MS);
    raw = await generateJson({ prompt, image: jpeg });
  }
  return { ...normalizeLlmJudge(raw, type), model: env.GROQ_MODEL, promptVersion: PROMPT_VERSION };
}