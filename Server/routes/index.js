import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import siteRoutes from './site.routes.js'; // upar imports me
// ...
import uploadRoutes from './upload.routes.js';
import reportRoutes from './report.routes.js';

import geoRoutes from './geo.routes.js';

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
router.use('/geo', geoRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);
export default router;
