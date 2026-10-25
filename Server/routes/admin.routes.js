import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect, requireRole('admin'));

router.get('/ping', (req, res) => {
  res.json({ success: true, data: { message: 'Admin access OK', admin: req.user.email } });
});

export default router;