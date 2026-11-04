import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { userLimiter } from '../middleware/limiters.js';
import { signUpload } from '../controllers/uploadController.js';

const router = Router();
// Report photo aur cleanup after-photo dono yahin se sign hoti hain
const limiter = userLimiter({ limit: 40 });

router.post('/sign', protect, limiter, signUpload);
export default router;