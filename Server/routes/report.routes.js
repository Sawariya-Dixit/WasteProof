import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReportSchema } from '../validators/report.validators.js';
import { createReport } from '../controllers/reportController.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', protect, limiter, validate(createReportSchema), createReport);

export default router;
