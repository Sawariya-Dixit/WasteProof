// Is phone ki random pehchaan (UUID). Server ko X-Device-Id header me jati hai, wahan sirf hash rakha jata hai.
// Fingerprinting nahi: koi hardware ya browser ki jankari nahi, localStorage saaf karne par naya id ban jata hai.
const KEY = 'junksnap-device';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memoryId = null; // localStorage band ho (private mode) to is session ke liye

function makeUuid() {
  if (crypto.randomUUID) return crypto.randomUUID(); // sirf HTTPS / localhost par hota hai
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !UUID.test(id)) {
      id = makeUuid();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return (memoryId ??= makeUuid());
  }
}