import { z } from 'zod';
import {
  REPORT_TYPES,
  PUBLIC_SITE_STATUSES,
  MAX_SITES_PER_QUERY,
  MAX_BBOX_SPAN_DEG,
  MAX_ACCURACY_M,
  PHOTO_FLAG_REASONS,
} from '../config/defaults.js';
import { inIndia } from '../utils/geo.js';

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

export const siteIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});
// Vote / me-too: voter ki abhi ki location (server doori khud nikaalta hai)
const voterGeo = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(MAX_ACCURACY_M),
};
const inIndiaRule = [(d) => inIndia(d.lat, d.lng), { path: ['lat'], message: 'Location India ke bahar hai' }];

export const voteSchema = z
  .object({ value: z.enum(['yes', 'no']), ...voterGeo })
  .strict()
  .refine(...inIndiaRule);

export const meTooSchema = z
  .object({ ...voterGeo })
  .strict()
  .refine(...inIndiaRule);

  export const reportPhotoSchema = z
  .object({ photoUrl: z.string().url().max(500), reason: z.enum(PHOTO_FLAG_REASONS) })
  .strict();

// After-photo ki Cloudinary key (POST /uploads/sign se) + abhi ki location
export const cleanupSchema = z
  .object({ key: z.string().min(1).max(200), ...voterGeo })
  .strict()
  .refine(...inIndiaRule);