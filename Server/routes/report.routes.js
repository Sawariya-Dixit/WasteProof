import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { userLimiter } from '../middleware/limiters.js';
import { validate } from '../middleware/validate.js';
import {
  createReportSchema,
  reportIdParamSchema,
  myReportsQuerySchema,
  confirmReportSchema,
} from '../validators/report.validators.js';
import { createReport, listMine, getOne, confirmReport } from '../controllers/reportController.js';

const router = Router();
const writeLimiter = userLimiter();
const readLimiter = userLimiter({ windowMs: 60 * 1000, limit: 120 }); // status polling ke liye

router.post('/', protect, writeLimiter, validate(createReportSchema), createReport);
router.get('/mine', protect, readLimiter, validate(myReportsQuerySchema, 'query'), listMine);
router.get('/:id', protect, readLimiter, validate(reportIdParamSchema, 'params'), getOne);
router.post(
  '/:id/confirm',
  protect,
  writeLimiter,
  validate(reportIdParamSchema, 'params'),
  validate(confirmReportSchema),
  confirmReport,
);

export default router;