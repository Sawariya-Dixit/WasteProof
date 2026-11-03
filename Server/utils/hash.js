import sharp from 'sharp';

// dHash (perceptual hash): photo ko 9x8 grayscale karke har pixel ki apne padosi se tulna.
// 64 bit = 16 hex akshar. Resize ya compress hone par bhi lagbhag wahi rehta hai.
export async function dHash({ data, info }) {
  const px = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
}

// Do hash me kitne bit alag hain (0 = bilkul same)
export function hamming(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}