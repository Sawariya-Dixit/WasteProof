import { env } from '../config/env.js';

export class LlmError extends Error {
  constructor(message, { blocked = false } = {}) {
    super(message);
    this.name = 'LlmError';
    this.blocked = blocked; // true = provider ne khud photo block ki (safety)
  }
}

// ```json ... ``` me lipta jawab ho to fence hata do
const stripFences = (s) => s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

// Ek photo + prompt bhejo, JSON jawab wapas lo
export async function generateJson({ prompt, image, mimeType = 'image/jpeg', timeoutMs = 30000 }) {
  if (!env.GEMINI_API_KEY) throw new LlmError('GEMINI_API_KEY .env me nahi hai');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: image.toString('base64') } },
          ],
        },
      ],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 300);
    throw new LlmError(`Gemini HTTP ${res.status}: ${body}`);
  }

  const json = await res.json();
  const blockReason = json?.promptFeedback?.blockReason;
  if (blockReason) throw new LlmError(`Gemini ne photo block ki (${blockReason})`, { blocked: true });

  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) {
    throw new LlmError(`Gemini ka jawab khaali (${json?.candidates?.[0]?.finishReason ?? 'unknown'})`);
  }
  try {
    return JSON.parse(stripFences(text));
  } catch {
    throw new LlmError('Gemini ka jawab JSON nahi tha');
  }
}