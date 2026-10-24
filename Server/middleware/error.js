import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (status >= 500) logger.error({ err }, 'Unhandled error');
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      details: err.details,
    },
  });
}