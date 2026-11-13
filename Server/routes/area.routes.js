import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { areasQuery, areaIdParam } from '../validators/area.validators.js';
import { ranking, areasMap, areaDetail, areaScore } from '../controllers/areaController.js';

const router = Router();

// '/ranking' aur '/map' hamesha '/:id' se PEHLE, warna inhe id maan lega
router.get('/ranking', validate(areasQuery, 'query'), ranking);
router.get('/map', validate(areasQuery, 'query'), areasMap);
router.get('/:id/score', validate(areaIdParam, 'params'), areaScore);
router.get('/:id', validate(areaIdParam, 'params'), areaDetail);

export default router;