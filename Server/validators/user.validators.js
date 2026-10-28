import { z } from 'zod';

export const updateMeSchema = z
  .object({
    language: z.enum(['en', 'hi']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Kuch to badlo (language ya theme)',
  });
