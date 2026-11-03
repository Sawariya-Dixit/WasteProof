import { randomUUID } from 'node:crypto';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const ALLOWED_FORMATS = ['jpg', 'png', 'webp'];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Original photo hamesha 'authenticated' type me: bina signed URL ke koi nahi khol sakta
const ORIGINAL_TYPE = 'authenticated';

export function createOriginalUploadSignature(userId) {
  // public_id server banata hai, user apni marzi ki key nahi de sakta
  const publicId = `originals/${userId}/${randomUUID()}`;
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    public_id: publicId,
    timestamp,
    type: ORIGINAL_TYPE,
    allowed_formats: ALLOWED_FORMATS.join(','),
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    apiKey: env.CLOUDINARY_API_KEY,
    ...paramsToSign,
    signature,
  };
}

// POST /reports me use hoga: key is user ke folder ki hai ya nahi
export const isOwnKey = (userId, key) =>
  typeof key === 'string' && key.startsWith(`originals/${userId}/`);

// POST /reports me use hoga: file sach me upload hui aur size/format theek hai
export async function verifyUploadedOriginal(publicId) {
  let r;
  try {
    r = await cloudinary.api.resource(publicId, { type: ORIGINAL_TYPE });
  } catch {
    throw new AppError('Photo upload nahi mili', 422, 'UPLOAD_NOT_FOUND');
  }
  if (r.bytes > MAX_UPLOAD_BYTES) {
    throw new AppError('Photo 8 MB se badi hai', 422, 'FILE_TOO_LARGE');
  }
  if (!ALLOWED_FORMATS.includes(r.format)) {
    throw new AppError('Sirf jpeg, png, webp allowed hai', 422, 'BAD_FORMAT');
  }
  return r;
}

// Worker (Day 9) blurred copy yahan daalega: ye public hai, original nahi
export async function uploadBlurred(buffer, reportId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: `blurred/${reportId}`, type: 'upload', overwrite: true },
        (err, result) => (err ? reject(err) : resolve(result)),
      )
      .end(buffer);
  });
}
// Worker ke liye: private original ko signed URL se download karo
export async function downloadOriginal(publicId) {
  const urls = [
    cloudinary.url(publicId, { type: ORIGINAL_TYPE, resource_type: 'image', sign_url: true, secure: true }),
    // Pehla na chale to API download link (frontend hamesha jpeg upload karta hai)
    cloudinary.utils.private_download_url(publicId, 'jpg', { type: ORIGINAL_TYPE, resource_type: 'image' }),
  ];
  let lastStatus;
  for (const url of urls) {
    const res = await fetch(url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_UPLOAD_BYTES) {
        throw new AppError('Original bahut badi hai', 422, 'FILE_TOO_LARGE');
      }
      return buf;
    }
    lastStatus = res.status;
  }
  throw new Error(`Original download fail (HTTP ${lastStatus})`);
}

// Rejected (unsafe) photo ka original storage se hata do
export async function deleteOriginal(publicId) {
  await cloudinary.uploader.destroy(publicId, {
    type: ORIGINAL_TYPE,
    resource_type: 'image',
    invalidate: true,
  });
}

// Day 11: public blurred copy ko LLM judge ke liye utaro (chhoti width, Cloudinary transform se).
// Transform na chale to wahi URL seedha. Ye copy pehle se blurred hai, isliye third-party ko bhejna safe hai.
export async function downloadBlurred(url, width = 1024) {
  const small = url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/w_${width},c_limit,q_auto:good,f_jpg/`)
    : url;
  for (const u of small === url ? [url] : [small, url]) {
    const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error('Blurred photo download nahi hui');
}
