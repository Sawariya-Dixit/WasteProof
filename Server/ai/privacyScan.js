import { z } from 'zod';
import { generateJson } from './llmClient.js';

// Ek hi call me: unsafe check + bache hue chehre + number plates (shak ho to bhi include)
export const SCAN_PROMPT = `You are a privacy and safety checker for photos of garbage and waste taken in India.
Return ONLY a JSON object in exactly this shape:
{"unsafe": boolean, "unsafe_reason": "none" | "adult" | "graphic_violence" | "other", "regions": [{"label": "face" | "license_plate" | "possible_license_plate", "box_2d": [ymin, xmin, ymax, xmax]}]}
Rules:
- box_2d uses integers from 0 to 1000, normalized to the image height (y) and width (x).
- List EVERY human face still visible, even small, far away, side-on, or partly hidden.
- List EVERY vehicle number plate (cars, bikes, autos, trucks, tractors), even small, far, or blurry. If you are not sure something is a plate, include it as "possible_license_plate".
- "unsafe" is true only for nudity, sexual content, or graphic violence, gore, or dead bodies. Garbage, dirt, and animals are not unsafe.
- Do not add any text outside the JSON.`;

const scanSchema = z.object({
  unsafe: z.boolean().default(false),
  unsafe_reason: z.string().optional(),
  regions: z
    .array(z.object({ label: z.string(), box_2d: z.array(z.number()).length(4) }))
    .default([]),
});

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Gemini ka jawab -> { unsafe, reason, faces:[{x,y,w,h}], plates:[{x,y,w,h}] } (sab 0-1 me)
export function parseScan(obj) {
  // Kabhi model seedha array bhej deta hai
  const input = Array.isArray(obj) ? { regions: obj } : obj;
  const p = scanSchema.parse(input); // shape galat ho to error, job retry hoga

  const faces = [];
  const plates = [];
  for (const r of p.regions) {
    const [ymin, xmin, ymax, xmax] = r.box_2d.map((v) => clamp01(v / 1000));
    const box = { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin };
    if (!(box.w > 0 && box.h > 0)) continue;
    const label = r.label.toLowerCase();
    if (label.includes('plate')) plates.push(box);
    else if (label.includes('face')) faces.push(box);
  }
  return {
    unsafe: p.unsafe,
    reason: p.unsafe ? (p.unsafe_reason ?? 'other') : 'none',
    faces,
    plates,
  };
}

// jpeg = pehle se local face-blur ki hui copy (poori unblurred photo third-party ko nahi jaati)
export async function scanImage(jpeg) {
  try {
    const raw = await generateJson({ prompt: SCAN_PROMPT, image: jpeg });
    return parseScan(raw);
  } catch (err) {
    // Provider ne khud photo block kar di (safety) = hum use unsafe maante hain
    if (err.blocked) return { unsafe: true, reason: 'provider_blocked', faces: [], plates: [] };
    throw err;
  }
}