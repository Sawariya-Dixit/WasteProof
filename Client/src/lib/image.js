// Cloudinary URL se chhota thumbnail. URL ka format alag ho to wahi wapas
export function thumbUrl(url, size = 160) {
  if (!url) return null;
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/w_${size},h_${size},c_fill,q_auto/`)
    : url;
}