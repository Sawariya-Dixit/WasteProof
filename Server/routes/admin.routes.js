import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { userLimiter } from '../middleware/limiters.js';
import { ADMIN } from '../config/defaults.js';
import {
  idParam, reviewListQuery, reviewActionSchema, repListQuery, repCreateSchema,
  repUpdateSchema, repImportSchema, adminAreasQuery, areaImportSchema,
} from '../validators/admin.validators.js';
import * as c from '../controllers/adminController.js';

const router = Router();
router.use(protect, requireRole('admin')); // har admin route par: login + DB ka role check
const writeLimit = userLimiter({ limit: ADMIN.writeLimitPerHour });

router.get('/ping', (req, res) => {
  res.json({ success: true, data: { message: 'Admin access OK', admin: req.user.email } });
});

// Review queue
router.get('/reports', validate(reviewListQuery, 'query'), c.reviewList);
router.get('/reports/:id', validate(idParam, 'params'), c.reviewOne);
router.patch('/reports/:id', writeLimit, validate(idParam, 'params'), validate(reviewActionSchema), c.reviewAction);

// BullMQ + report status counts
router.get('/queue/stats', c.stats);

// Areas
router.get('/areas', validate(adminAreasQuery, 'query'), c.areasList);
router.post('/areas/import', writeLimit, validate(areaImportSchema), c.areasImport);

// Representatives (party field nahi)
router.get('/representatives', validate(repListQuery, 'query'), c.repsList);
router.post('/representatives/import', writeLimit, validate(repImportSchema), c.repsImport);
router.post('/representatives', writeLimit, validate(repCreateSchema), c.repsCreate);
router.patch('/representatives/:id', writeLimit, validate(idParam, 'params'), validate(repUpdateSchema), c.repsUpdate);
router.delete('/representatives/:id', writeLimit, validate(idParam, 'params'), c.repsDelete);

export default router;