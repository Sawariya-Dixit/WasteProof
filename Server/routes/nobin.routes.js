import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { userLimiter } from '../middleware/limiters.js';
import { validate } from '../middleware/validate.js';
import { NOBIN } from '../config/defaults.js';
import { createNobinSchema, listNobinQuery } from '../validators/nobin.validators.js';
import { getZones, postZone } from '../controllers/nobinController.js';

const router = Router();
const dailyLimiter = userLimiter({ windowMs: 24 * 60 * 60 * 1000, limit: NOBIN.perDay });

router.get('/', validate(listNobinQuery, 'query'), getZones);
router.post('/', protect, dailyLimiter, validate(createNobinSchema), postZone);

export default router;