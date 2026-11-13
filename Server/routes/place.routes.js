import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { placesQuery } from '../validators/place.validators.js';
import { places } from '../controllers/areaController.js';

const router = Router();
router.get('/', validate(placesQuery, 'query'), places);

export default router;