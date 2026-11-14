import { z } from 'zod';
import { REPORT_TYPES, LETTER_SCOPES, LETTER_LANGS } from '../config/defaults.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createLetterSchema = z
  .object({
    scope: z.enum(LETTER_SCOPES),
    siteId: objectId.optional(),
    areaId: objectId.optional(),
    issueType: z.enum(REPORT_TYPES).optional(), // site letter me site ka apna type use hota hai
    lang: z.enum(LETTER_LANGS).default('en'),
  })
  .superRefine((v, ctx) => {
    if (v.scope === 'site') {
      if (!v.siteId) ctx.addIssue({ code: 'custom', path: ['siteId'], message: 'siteId required' });
    } else {
      if (!v.areaId) ctx.addIssue({ code: 'custom', path: ['areaId'], message: 'areaId required' });
      if (!v.issueType) ctx.addIssue({ code: 'custom', path: ['issueType'], message: 'issueType required' });
    }
  });

export const letterIdParam = z.object({ id: objectId });
