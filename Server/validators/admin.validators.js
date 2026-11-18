import { z } from 'zod';
import { ADMIN, REP_OFFICES, AREA_IMPORT_LEVELS } from '../config/defaults.js';
import { inIndia } from '../utils/geo.js';

const oid = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(ADMIN.maxLimit).default(ADMIN.defaultLimit);

export const idParam = z.object({ id: oid });

export const reviewListQuery = z.object({
  status: z.enum(ADMIN.reviewStatuses).optional(),
  page,
  limit,
});

export const reviewActionSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'retry']),
    reason: z.string().trim().min(ADMIN.reasonMin).max(ADMIN.reasonMax).optional(),
  })
  .strict()
  .refine((d) => d.action === 'retry' || !!d.reason, {
    path: ['reason'],
    message: 'Approve ya reject ke saath reason zaroori hai',
  });

export const repListQuery = z.object({
  areaId: oid.optional(),
  office: z.enum(REP_OFFICES).optional(),
  page,
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const repCreateSchema = z
  .object({
    office: z.enum(REP_OFFICES),
    areaId: oid,
    name: z.string().trim().min(2).max(120),
    contactNote: z.string().trim().max(300).optional(),
  })
  .strict();

export const repUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    contactNote: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Kuch to badlo (name ya contactNote)' });

export const repImportSchema = z
  .object({
    csv: z.string().min(10).max(ADMIN.repsImportMaxChars),
    dryRun: z.boolean().optional(),
  })
  .strict();

export const adminAreasQuery = z.object({
  level: z.enum(['ward', 'assembly', 'loksabha', 'district']).optional(),
  q: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const areaImportSchema = z
  .object({
    level: z.enum(AREA_IMPORT_LEVELS),
    geojson: z
      .object({
        type: z.literal('FeatureCollection'),
        features: z.array(z.any()).min(1).max(ADMIN.importMaxFeatures),
      })
      .passthrough(),
    pilotPoint: z
      .object({ lat: z.number(), lng: z.number() })
      .refine((p) => inIndia(p.lat, p.lng), { message: 'pilotPoint India ke bahar hai' })
      .optional(),
    dryRun: z.boolean().optional(),
  })
  .strict();