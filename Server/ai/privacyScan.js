import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { scanWithRekognition } from './rekognitionScan.js';

// jpeg = pehle se local face-blur ki hui copy (poori unblurred photo third-party ko nahi jaati)
// Return: { unsafe, reason, faces:[{x,y,w,h}], plates:[{x,y,w,h}], labels:[{name,conf}] } (boxes 0-1 me)
export async function scanImage(jpeg) {
  // Dev switch: bina AWS ke chalane ke liye. Plates aur unsafe check NAHI hota.
  if (env.PRIVACY_SCAN === 'local') {
    if (env.NODE_ENV === 'production') {
      throw new Error('PRIVACY_SCAN=local production me allowed nahi hai');
    }
    logger.warn('PRIVACY_SCAN=local: plates aur unsafe check skip ho rahe hain (sirf test ke liye)');
    return { unsafe: false, reason: 'none', faces: [], plates: [], labels: [], skipped: true };
  }
  return scanWithRekognition(jpeg);
}