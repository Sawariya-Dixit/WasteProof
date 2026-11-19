import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { protect, requireRole } from './middleware/auth.js';
import { ADMIN } from './config/defaults.js';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { sanitize } from './middleware/sanitize.js';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './docs/openapi.js';
import { mountBullBoard } from './routes/bullBoard.js';
const app = express();

app.set('trust proxy', 1); // Render/Railway ke peeche sahi IP ke liye
// Swagger UI (helmet se pehle, warna CSP uski inline script rok deti hai). Production me band.
if (env.NODE_ENV !== 'production') {
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }),
  );
}

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/healthz' || req.url.endsWith('/health') },
    // Headers aur query log me nahi: sirf method, path, status
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url.split('?')[0] }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customLogLevel: (req, res, err) =>
      err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
  }),
);
// Admin GeoJSON import bada hota hai (mp_ac.geojson ~1.7 MB). Bada limit SIRF is ek route par, aur
// login+admin check body parse hone se PEHLE, taaki koi anjaan 25 MB na bhej sake.
app.use(
  '/api/v1/admin/areas/import',
  protect,
  requireRole('admin'),
  express.json({ limit: ADMIN.importBodyLimit }),
);
app.use(express.json({ limit: '1mb' }));
app.use(sanitize); // body se $ aur . wali keys hatao
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.API_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/healthz', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
