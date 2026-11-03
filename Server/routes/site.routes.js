import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { listSitesQuery, siteIdParamSchema } from '../validators/site.validators.js';
import { listSites, getSite } from '../controllers/siteController.js';

const router = Router();

router.get('/', validate(listSitesQuery, 'query'), listSites);
router.get('/:id', validate(siteIdParamSchema, 'params'), getSite);

export default router;
