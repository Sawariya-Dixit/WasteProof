import { z } from 'zod';
import {
  REPORT_TYPES,
  PUBLIC_SITE_STATUSES,
  MAX_SITES_PER_QUERY,
  MAX_BBOX_SPAN_DEG,
} from '../config/defaults.js';

const bbox = z
  .string()
  .transform((s) => s.split(',').map((p) => (p.trim() === '' ? NaN : Number(p))))
  .pipe(z.array(z.number()).length(4, 'bbox = minLng,minLat,maxLng,maxLat'))
  .refine(
    ([minLng, minLat, maxLng, maxLat]) =>
      minLng >= -180 &&
      maxLng <= 180 &&
      minLat >= -90 &&
      maxLat <= 90 &&
      minLng < maxLng &&
      minLat < maxLat,
    'bbox ki values galat hain',
  )
  .refine(
    ([minLng, minLat, maxLng, maxLat]) =>
      maxLng - minLng <= MAX_BBOX_SPAN_DEG && maxLat - minLat <= MAX_BBOX_SPAN_DEG,
    'bbox bahut bada hai, map zoom karo',
  );

export const listSitesQuery = z.object({
  bbox,
  type: z.enum(REPORT_TYPES).optional(),
  status: z.enum(PUBLIC_SITE_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_SITES_PER_QUERY).default(MAX_SITES_PER_QUERY),
});
