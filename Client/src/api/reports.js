import { api, ApiError } from './client';

export async function signUpload() {
  const res = await api.post('/uploads/sign');
  return res.data.data;
}

// fetch me upload progress nahi milta, isliye XMLHttpRequest
export function uploadToCloudinary(sign, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('api_key', sign.apiKey);
    form.append('timestamp', String(sign.timestamp));
    form.append('public_id', sign.public_id);
    form.append('type', sign.type);
    form.append('allowed_formats', sign.allowed_formats);
    form.append('signature', sign.signature);
    form.append('file', blob, 'photo.jpg'); // file hamesha last me

    const xhr = new XMLHttpRequest();
    xhr.open('POST', sign.uploadUrl);
    xhr.timeout = 60000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError('Upload failed', 'UPLOAD_FAILED', xhr.status));
    xhr.onerror = () => reject(new ApiError('Network error', 'NETWORK_ERROR', 0));
    xhr.ontimeout = () => reject(new ApiError('Upload timed out', 'NETWORK_ERROR', 0));
    xhr.send(form);
  });
}

export async function createReport(body) {
  const res = await api.post('/reports', body);
  return res.data.data.report;
}