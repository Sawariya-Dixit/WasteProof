import { Router } from 'express';
import { env } from '../config/env.js';
import { protect } from '../middleware/auth.js';
import { userLimiter } from '../middleware/limiters.js';
import { validate } from '../middleware/validate.js';
import { createLetterSchema, letterIdParam } from '../validators/letter.validators.js';
import { postLetter, getLetterById, getLetterPdf } from '../controllers/letterController.js';

const router = Router();
const letterLimiter = userLimiter({ limit: env.LETTERS_PER_HOUR }); // LLM cost, har user ki apni limit
const pdfLimiter = userLimiter(); // PDF banana sasta hai, par bekaar spam se bachne ke liye

router.post('/', protect, letterLimiter, validate(createLetterSchema), postLetter);
router.get('/:id/pdf', protect, pdfLimiter, validate(letterIdParam, 'params'), getLetterPdf);
router.get('/:id', protect, validate(letterIdParam, 'params'), getLetterById);

export default router;