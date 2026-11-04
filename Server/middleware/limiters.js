import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

// Har LOGGED-IN user ki apni limit (IP ki nahi). Proxy / tunnel / ek hi wifi par kai phone hon
// to sab ek IP dikhte hain aur ek bucket baant lete, isliye user id se ginte hain.
// protect middleware ke BAAD lagao, warna req.user nahi hota (tab IP se ginta hai).
export function userLimiter({ windowMs = 60 * 60 * 1000, limit = env.WRITE_LIMIT_PER_HOUR } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user ? `u:${req.user._id}` : ipKeyGenerator(req.ip)),
  });
}