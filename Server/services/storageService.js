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
