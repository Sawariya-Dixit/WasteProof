import { env } from './env.js';
import { SCORES } from './defaults.js';

export function assertProductionSafe() {
  if (env.NODE_ENV !== 'production') return;
  const bad = [];
  if (/localhost|127\.0\.0\.1/.test(env.CLIENT_URL)) bad.push('CLIENT_URL abhi localhost hai (asli Vercel URL do)');
  if (env.PRIVACY_SCAN !== 'rekognition') bad.push('PRIVACY_SCAN=rekognition hona chahiye (local me plates blur nahi hote)');
  if (SCORES.includeTest) bad.push('config/defaults.js: SCORES.includeTest false karo');
  if (env.SNAPS_PER_HOUR > 50) bad.push('SNAPS_PER_HOUR field-test wali value hai, wapas 20 karo');
  if (env.BULL_BOARD_USER && (env.BULL_BOARD_PASS?.length ?? 0) < 12) bad.push('BULL_BOARD_PASS kam se kam 12 akshar ka rakho');
  if (!env.DEVICE_SALT || env.DEVICE_SALT === 'junksnap-dev') bad.push('DEVICE_SALT apna random secret rakho');
  if (bad.length) throw new Error(`Production config theek nahi:\n - ${bad.join('\n - ')}`);
}