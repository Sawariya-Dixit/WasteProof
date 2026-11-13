import { z } from 'zod';
import { SCORE_LEVELS } from '../config/defaults.js';

export const areasQuery = z.object({
  level: z.enum(SCORE_LEVELS).default('assembly'),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const areaIdParam = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});