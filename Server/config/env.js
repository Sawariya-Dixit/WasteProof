import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI required'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  AWS_REGION: z.string().default('ap-south-1'),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  NOMINATIM_URL: z.string().default('https://nominatim.openstreetmap.org'),
  // Nominatim ki policy: apni app ka naam + contact do
  NOMINATIM_USER_AGENT: z.string().min(1, 'NOMINATIM_USER_AGENT required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  process.exit(1);
}
export const env = parsed.data;
