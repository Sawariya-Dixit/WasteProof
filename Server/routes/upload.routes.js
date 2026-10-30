import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { signUpload } from '../controllers/uploadController.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/sign', protect, limiter, signUpload);
export default router;
