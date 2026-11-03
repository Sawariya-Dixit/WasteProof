// Perceptual (difference) hash: photo ko 9x8 grayscale karo, har pixel apne daayein wale se
// bright hai ya nahi = 1 bit. 8 x 8 = 64 bit = 16 hex chars. Pure functions, koi library nahi.

// gray = 72 bytes (9 columns x 8 rows, row by row). Return: 16 char hex
export function dHashFromGray(gray) {
  if (!gray || gray.length !== 72) throw new Error('dHash ke liye 9x8 = 72 gray bytes chahiye');
  let bits = 0n;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = gray[row * 9 + col];
      const right = gray[row * 9 + col + 1];
      bits = (bits << 1n) | (left > right ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

// Do hex hashes me kitne bit alag hain (0 = bilkul same, 64 = ulta)
export function hammingHex(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}
