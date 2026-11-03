import {
  RekognitionClient,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
  DetectLabelsCommand,
  DetectTextCommand,
} from '@aws-sdk/client-rekognition';
import { env } from '../config/env.js';
import { REKOGNITION } from '../config/defaults.js';

// Keys env.js se aati hain. Dono na ho to SDK apni default jagah (process.env / AWS profile) dekhta hai
const client = new RekognitionClient({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

const BLOCKED = new Set(REKOGNITION.blockedModeration);

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Rekognition BoundingBox (0-1, kabhi photo ke bahar bhi) -> { x, y, w, h } (0-1, clamp)
export function toBox(b) {
  const x = clamp01(b.Left);
  const y = clamp01(b.Top);
  const w = clamp01(b.Left + b.Width) - x;
  const h = clamp01(b.Top + b.Height) - y;
  return { x, y, w, h };
}

// Pure function: AWS ke 4 jawab -> hamare pipeline ka format. Isko bina AWS ke test kar sakte ho.
export function parseRekognition({ faces, moderation, labels, text }) {
  const unsafe = (moderation?.ModerationLabels ?? []).some(
    (l) =>
      (l.Confidence ?? 0) >= REKOGNITION.moderationMinConfidence &&
      (BLOCKED.has(l.Name) || BLOCKED.has(l.ParentName)),
  );

  const faceBoxes = (faces?.FaceDetails ?? []).map((f) => toBox(f.BoundingBox));

  const plates = [];
  for (const l of labels?.Labels ?? []) {
    if (l.Name === 'License Plate') {
      for (const inst of l.Instances ?? []) plates.push(toBox(inst.BoundingBox));
    }
  }
  // Backup: gaadi ki plate jaisa text (4+ akshar/ank aur kam se kam ek ank). Shak ho to zyada blur.
  for (const t of text?.TextDetections ?? []) {
    if (t.Type !== 'LINE') continue;
    const clean = String(t.DetectedText ?? '').replace(/[^A-Za-z0-9]/g, '');
    if (clean.length >= 4 && /\d/.test(clean)) plates.push(toBox(t.Geometry.BoundingBox));
  }

  return {
    unsafe,
    reason: unsafe ? 'moderation' : 'none',
    faces: faceBoxes.filter((b) => b.w > 0 && b.h > 0),
    plates: plates.filter((b) => b.w > 0 && b.h > 0),
    // Day 11 ka waste judge inhi labels se chalega
    labels: (labels?.Labels ?? []).map((l) => ({ name: l.Name, conf: Math.round(l.Confidence) })),
  };
}

// jpeg = local face-blur ki hui copy (Buffer, 5 MB se kam)
export async function scanWithRekognition(jpeg) {
  const Image = { Bytes: jpeg };
  const [faces, moderation, labels, text] = await Promise.all([
    client.send(new DetectFacesCommand({ Image })),
    client.send(
      new DetectModerationLabelsCommand({
        Image,
        MinConfidence: REKOGNITION.moderationFetchConfidence,
      }),
    ),
    client.send(
      new DetectLabelsCommand({
        Image,
        MaxLabels: REKOGNITION.maxLabels,
        MinConfidence: REKOGNITION.labelsMinConfidence,
      }),
    ),
    client.send(new DetectTextCommand({ Image })),
  ]);
  return parseRekognition({ faces, moderation, labels, text });
}

// Day 11: sirf labels (waste judge ko test photos par tune karne ke liye). 4 ki jagah 1 AWS call.
export async function fetchLabels(jpeg) {
  const res = await client.send(
    new DetectLabelsCommand({
      Image: { Bytes: jpeg },
      MaxLabels: REKOGNITION.maxLabels,
      MinConfidence: REKOGNITION.labelsMinConfidence,
    }),
  );
  return (res.Labels ?? []).map((l) => ({ name: l.Name, conf: Math.round(l.Confidence) }));
}
