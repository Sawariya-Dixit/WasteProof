// Tests ke liye dummy env. Asli .env ya internet ki zaroorat nahi.
// Koi test jo env.js (ya logger / models) import karta hai, pehle ye import kare.
process.env.NODE_ENV = 'test';
const dummy = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/junksnap-test',
  COGNITO_USER_POOL_ID: 'ap-south-1_test',
  COGNITO_CLIENT_ID: 'testclient',
  NOMINATIM_USER_AGENT: 'junksnap-tests',
  CLOUDINARY_CLOUD_NAME: 'test',
  CLOUDINARY_API_KEY: 'test',
  CLOUDINARY_API_SECRET: 'test',
  REDIS_URL: 'redis://127.0.0.1:6379',
};
for (const [k, v] of Object.entries(dummy)) process.env[k] ??= v;
