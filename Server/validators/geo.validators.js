import { z } from 'zod';
import { inIndia } from '../utils/geo.js';

export const resolveQuery = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  })
  .refine((q) => inIndia(q.lat, q.lng), 'Location India ke bahar hai');
