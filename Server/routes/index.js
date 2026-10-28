import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import siteRoutes from './site.routes.js'; // upar imports me
// ...
const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'down' },
  });
});

router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/sites', siteRoutes);

export default router;
