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
  REDIS_URL: z.string().min(1, 'REDIS_URL required'),
  // 'rekognition' = asli scan (faces, plates, unsafe). 'local' = sirf dev, plates/safety check nahi
  PRIVACY_SCAN: z.enum(['rekognition', 'local']).default('rekognition'),
  // Rekognition ke liye IAM user ki keys (Cognito wali nahi). Dono saath me dena, ya dono khaali
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  // Day 11: waste judge ka doosra raay (Groq vision). Key na ho ya VERIFY_LLM=off ho to sirf Rekognition labels chalte hain
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('meta-llama/llama-4-scout-17b-16e-instruct'),
  VERIFY_LLM: z.enum(['on', 'off']).default('on'),
    VOTE_MAX_DISTANCE_M: z.coerce.number().default(300),
  VOTE_MAX_ACCURACY_M: z.coerce.number().default(100),
    // Day 14: field-test ke liye limits .env se badlo (production me default hi rakho)
  SNAPS_PER_HOUR: z.coerce.number().default(20), // ek user ki reports per ghanta
  WRITE_LIMIT_PER_HOUR: z.coerce.number().default(60), // ek user ke vote / flag / confirm per ghanta
  API_RATE_LIMIT: z.coerce.number().default(300), // ek IP ki saari /api calls per 15 min
  
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  process.exit(1);
}
export const env = parsed.data;