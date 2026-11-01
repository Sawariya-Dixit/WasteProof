import sharp from 'sharp';
import { FACE_BLUR, MAX_IMAGE_DIM } from '../config/defaults.js';

// Photo ko seedha karo (EXIF rotation), max 1600 px par lao aur raw RGB banao
export async function prepareImage(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_IMAGE_DIM, height: MAX_IMAGE_DIM, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info: { width: info.width, height: info.height, channels: 3 } };
}

// boxes = [{ x, y, w, h }] pixels me. Har box ke aas-paas pad% extra (shak ho to zyada blur).
// Return: JPEG buffer. sharp output me EXIF/GPS nahi rakhta.
export async function blurRegions({ data, info }, boxes, { pad = FACE_BLUR.pad, sigma = FACE_BLUR.sigma } = {}) {
  const { width: W, height: H } = info;
  const rawOpts = { raw: { width: W, height: H, channels: 3 } };

  const overlays = [];
  for (const b of boxes) {
    const px = Math.round(b.w * pad);
    const py = Math.round(b.h * pad);
    const left = Math.max(0, Math.round(b.x - px));
    const top = Math.max(0, Math.round(b.y - py));
    const width = Math.min(W - left, Math.round(b.w + 2 * px));
    const height = Math.min(H - top, Math.round(b.h + 2 * py));
    if (width < 2 || height < 2) continue;

    const piece = await sharp(data, rawOpts)
      .extract({ left, top, width, height })
      .blur(Math.max(sigma, Math.min(width, height) / 6))
      .raw()
      .toBuffer({ resolveWithObject: true });
    overlays.push({
      input: piece.data,
      raw: { width: piece.info.width, height: piece.info.height, channels: piece.info.channels },
      left,
      top,
    });
  }

  const img = sharp(data, rawOpts);
  return (overlays.length ? img.composite(overlays) : img).jpeg({ quality: 85 }).toBuffer();
}