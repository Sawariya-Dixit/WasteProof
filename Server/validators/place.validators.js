import { z } from 'zod';
import { bbox } from './site.validators.js';

export const placesQuery = z.object({
  bbox,
  limit: z.coerce.number().int().min(1).max(50).default(20),
});