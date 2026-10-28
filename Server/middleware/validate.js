import { AppError } from '../utils/AppError.js';

export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      req.valid = { ...req.valid, [source]: result.data };
    }
    next();
  };