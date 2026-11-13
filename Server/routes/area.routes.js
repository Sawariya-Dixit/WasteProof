import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { areasQuery } from '../validators/area.validators.js';
import { ranking, areasMap } from '../controllers/areaController.js';

const router = Router();

// NOTE: Day 16 me '/:id' wale routes inke NEECHE lagana, warna 'ranking' ko id maan lega
router.get('/ranking', validate(areasQuery, 'query'), ranking);
router.get('/map', validate(areasQuery, 'query'), areasMap);

export default router;