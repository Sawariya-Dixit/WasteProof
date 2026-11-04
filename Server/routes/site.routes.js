import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, optionalProtect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listSitesQuery,
  siteIdParamSchema,
  voteSchema,
  meTooSchema,
  reportPhotoSchema,
  cleanupSchema,
} from '../validators/site.validators.js';
import {
  listSites,
  getSite,
  postVote,
  postMeToo,
  postCleanup,
  postReportPhoto,
} from '../controllers/siteController.js';

const router = Router();
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', validate(listSitesQuery, 'query'), listSites);
router.get('/:id', optionalProtect, validate(siteIdParamSchema, 'params'), getSite);
router.post(
  '/:id/votes',
  protect,
  voteLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(voteSchema),
  postVote,
);
router.post(
  '/:id/me-too',
  protect,
  voteLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(meTooSchema),
  postMeToo,
);
router.post(
  '/:id/report-photo',
  protect,
  voteLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(reportPhotoSchema),
  postReportPhoto,
);
router.post(
  '/:id/cleanups',
  protect,
  voteLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(cleanupSchema),
  postCleanup,
);

export default router;