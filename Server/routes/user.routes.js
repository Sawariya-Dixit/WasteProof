import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/user.validators.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = Router();

router.use(protect);
router.get('/me', getMe);
router.patch('/me', validate(updateMeSchema), updateMe);

export default router;
