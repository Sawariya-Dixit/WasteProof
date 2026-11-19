import path from 'node:path';
import { fileURLToPath } from 'node:url';

// true = ye file seedha `node file.js` se chalayi gayi (kisi dusri file ne import nahi ki).
// Isse worker file dono tarah chal sakti hai: alag process me, ya server ke andar.
export function isMain(metaUrl) {
  if (!process.argv[1]) return false;
  const a = path.resolve(fileURLToPath(metaUrl));
  const b = path.resolve(process.argv[1]);
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}