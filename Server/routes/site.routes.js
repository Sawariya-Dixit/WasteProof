import { Router } from 'express';
import { userLimiter } from '../middleware/limiters.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { deviceGuard } from '../middleware/Device.js';
import { validate } from '../middleware/validate.js';
import {
  listSitesQuery,
  siteIdParamSchema,
  voteSchema,
  meTooSchema,
  reportPhotoSchema,
  cleanupSchema,
} from '../validators/site.validators.js';
import { addSitePhotoSchema } from '../validators/report.validators.js';
import { createNoteSchema, notesQuery, noteParams } from '../validators/note.validators.js';
import { NOTES } from '../config/defaults.js';
import {
  listSites,
  getSite,
  postVote,
  postMeToo,
  postCleanup,
  postReportPhoto,
  postSitePhoto,
  getSitePhotos,
} from '../controllers/siteController.js';
import { getNotes, postNote, removeNote } from '../controllers/noteController.js';

const router = Router();
const voteLimiter = userLimiter(); // vote / me-too / flag / cleanup, har user ki apni limit
const photoLimiter = userLimiter(); // add photo, reports jaisi alag limit
const noteLimiter = userLimiter({ limit: NOTES.perHour }); // notes ke liye alag, kam limit

router.get('/', validate(listSitesQuery, 'query'), listSites);
router.get('/:id', optionalProtect, validate(siteIdParamSchema, 'params'), getSite);
router.get('/:id/photos', validate(siteIdParamSchema, 'params'), getSitePhotos);
router.post(
  '/:id/photos',
  protect,
  deviceGuard,
  photoLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(addSitePhotoSchema),
  postSitePhoto,
);
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

// Day 20: notes
router.get(
  '/:id/notes',
  optionalProtect,
  validate(siteIdParamSchema, 'params'),
  validate(notesQuery, 'query'),
  getNotes,
);
router.post(
  '/:id/notes',
  protect,
  noteLimiter,
  validate(siteIdParamSchema, 'params'),
  validate(createNoteSchema),
  postNote,
);
router.delete('/:id/notes/:noteId', protect, validate(noteParams, 'params'), removeNote);

export default router;