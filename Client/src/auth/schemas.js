import { z } from 'zod';

// Messages i18n keys hain: UI me t(error.message) se dikhte hain.
// Baad me ye schemas server ke saath share kiye ja sakte hain.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('validation.email'));

// Cognito pool policy: 8+ chars, capital, small, number, special
export const passwordSchema = z
  .string()
  .min(8, 'validation.pwMin')
  .regex(/[a-z]/, 'validation.pwLower')
  .regex(/[A-Z]/, 'validation.pwUpper')
  .regex(/\d/, 'validation.pwNumber')
  .regex(/[^A-Za-z0-9]/, 'validation.pwSpecial');

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'validation.code');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z
  .object({ email: emailSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.pwMatch',
  });

export const verifySchema = z.object({ code: codeSchema });
export const forgotEmailSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ code: codeSchema, newPassword: passwordSchema });
