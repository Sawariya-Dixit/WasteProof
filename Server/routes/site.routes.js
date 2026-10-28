import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { listSitesQuery } from '../validators/site.validators.js';
import { listSites } from '../controllers/siteController.js';

const router = Router();

router.get('/', validate(listSitesQuery, 'query'), listSites);

export default router;
