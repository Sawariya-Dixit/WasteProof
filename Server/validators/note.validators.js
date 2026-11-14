import { z } from 'zod';
import { NOTES } from '../config/defaults.js';
import { cleanNoteText } from '../utils/pii.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

// HTML hata kar 3-500 chars. PII ki jaanch service me (alag error code ke liye).
export const createNoteSchema = z
  .object({
    text: z
      .string()
      .max(NOTES.maxChars * 4)
      .transform(cleanNoteText)
      .pipe(z.string().min(NOTES.minChars).max(NOTES.maxChars)),
  })
  .strict();

export const notesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(NOTES.maxLimit).default(NOTES.defaultLimit),
});

export const noteParams = z.object({ id: objectId, noteId: objectId });