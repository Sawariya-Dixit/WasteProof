import { env } from '../config/env.js';
import { LLM_JUDGE_TIMEOUT_MS } from '../config/defaults.js';

export class LlmError extends Error {
  constructor(message, { status = null } = {}) {
    super(message);
    this.name = 'LlmError';
    this.status = status; // 429 = Groq rate limit
  }
}

// Groq OpenAI-compatible API hai. Vision model: meta-llama/llama-4-scout-17b-16e-instruct (GROQ_MODEL se badlo)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ```json ... ``` me lipta jawab ho to fence hata do
const stripFences = (s) => s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

// Ek photo + prompt bhejo, JSON jawab wapas lo. Prompt me "JSON" shabd hona zaroori hai (Groq JSON mode).
export async function generateJson({
  prompt,
  image,
  mimeType = 'image/jpeg',
  timeoutMs = LLM_JUDGE_TIMEOUT_MS,
}) {
  if (!env.GROQ_API_KEY) throw new LlmError('GROQ_API_KEY .env me nahi hai');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0,
      max_completion_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${image.toString('base64')}` },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 300);
    throw new LlmError(`Groq HTTP ${res.status}: ${body}`, { status: res.status });
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new LlmError(`Groq ka jawab khaali (${json?.choices?.[0]?.finish_reason ?? 'unknown'})`);
  try {
    return JSON.parse(stripFences(text));
  } catch {
    throw new LlmError('Groq ka jawab JSON nahi tha');
  }
}
