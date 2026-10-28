import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { resolveQuery } from '../validators/geo.validators.js';
import { resolveLocation } from '../controllers/geoController.js';

const router = Router();

// Ye endpoint bahar (Nominatim) call karta hai, isliye IP par alag, kadak limit
const geoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/resolve', geoLimiter, validate(resolveQuery, 'query'), resolveLocation);

export default router;
