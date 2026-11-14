import { z } from 'zod';
import { NOBIN } from '../config/defaults.js';
import { inIndia } from '../utils/geo.js';
import { bbox } from './site.validators.js';

// Reporter ki abhi ki location (khade hone ki jagah)
export const createNobinSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).max(500),
  })
  .strict()
  .refine((d) => inIndia(d.lat, d.lng), { path: ['lat'], message: 'Location India ke bahar hai' });

export const listNobinQuery = z.object({
  bbox,
  limit: z.coerce.number().int().min(1).max(500).default(NOBIN.maxPerQuery),
});