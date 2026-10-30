import { z } from 'zod';
import { REPORT_TYPES, MAX_ACCURACY_M, NOTE_MAX_CHARS } from '../config/defaults.js';
import { inIndia } from '../utils/geo.js';

const stripHtml = (s) => s.replace(/<[^>]*>/g, '').trim();

export const createReportSchema = z
  .object({
    key: z.string().min(1).max(200), // Cloudinary public_id (originals/<userId>/<uuid>)
    sha256: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/, 'sha256 64 hex chars ka hona chahiye')
      .transform((s) => s.toLowerCase()),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).max(MAX_ACCURACY_M),
    capturedAt: z.iso.datetime({ offset: true }).transform((s) => new Date(s)),
    type: z.enum(REPORT_TYPES),
    note: z
      .string()
      .max(NOTE_MAX_CHARS * 2) // HTML strip hone se pehle thoda bada allow
      .transform(stripHtml)
      .pipe(z.string().max(NOTE_MAX_CHARS))
      .optional(),
  })
  .strict()
  .refine((d) => inIndia(d.lat, d.lng), {
    path: ['lat'],
    message: 'Location India ke bahar hai',
  });
