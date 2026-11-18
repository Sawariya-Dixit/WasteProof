# JunkSnap

Snap the junk. Prove it. Get it cleared.
Civic waste reporting platform (MERN): photo + GPS, privacy blur, AI check, 10-person verification,
area scores aur cited letter draft. Pilot: Khategaon, Dewas (Madhya Pradesh).

## Folder structure

```
JunkSnap/
  Client/   React + Vite PWA (Map, Snap, Site, Areas, Letter, Activity, Admin)
  Server/   Node + Express API, BullMQ workers, Mongo models, scripts, tests
```

## Zaroori accounts

MongoDB Atlas, AWS Cognito (User Pool + App Client), Cloudinary, Redis (Upstash/Redis Cloud),
AWS Rekognition (IAM user), Groq API key.

## Chalane ka tareeka (local)

```bash
# 1) API
cd Server
npm install
cp .env.example .env        # values bharo, .env kabhi commit mat karo
npm run dev                 # http://localhost:5000  (Swagger: /docs, health: /healthz)

# 2) Worker (alag terminal, report pipeline ke liye zaroori)
cd Server
npm run worker
npm run worker:notes        # notes ka AI summary (optional)

# 3) Client
cd Client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Pehli baar data seed

```bash
cd Server
node scripts/importGeoJSON.js data/mp_ac.geojson   --level=assembly --pilot-point=22.5933,76.9132
node scripts/importGeoJSON.js data/mp_pc.geojson   --level=loksabha  --pilot-point=22.5933,76.9132
node scripts/importGeoJSON.js data/mp_dist.geojson --level=district  --pilot-point=22.5933,76.9132
npm run seed:rules
npm run seed:bodies
npm run seed:reps           # pehle data/representatives.csv me FILL_ME ki jagah asli naam bharo
```

## Useful commands (Server)

| Command | Kaam |
| --- | --- |
| `npm test` | unit tests (dummy env, internet/DB nahi chahiye) |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run scores` | area scores ek baar chalao |
| `npm run stats:queue` | BullMQ counts aur failed jobs |
| `npm run make:admin` | kisi user ko admin banao |
| `npm run audit:data` | seats, reps, local bodies ka data check |
| `npm run check:all` | integration check |

## Environment variables (sirf naam, Server/.env.example dekho)

`NODE_ENV, PORT, MONGO_URI, CLIENT_URL, AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID,
NOMINATIM_URL, NOMINATIM_USER_AGENT, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
REDIS_URL, PRIVACY_SCAN, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, GROQ_API_KEY, GROQ_MODEL, VERIFY_LLM,
SNAPS_PER_HOUR, WRITE_LIMIT_PER_HOUR, API_RATE_LIMIT, SCORES_CRON, LETTER_LLM, LETTERS_PER_HOUR,
BULL_BOARD_USER, BULL_BOARD_PASS, DEVICE_SNAPS_PER_HOUR, DEVICE_SALT`

Client: `VITE_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID`

## Deploy

Client: Vercel. API + worker: do alag Docker/Node services (Render/Railway), ek hi repo.
Production me `NODE_ENV=production` rakho, `config/prodGuard.js` unsafe settings par start rok deta hai.

## Licence note

Idea hackathon winner "JunkSnap" (Girish-Garg/JunkSnap, AGPL-3.0) se inspired hai.
Unki source files copy nahi ki gayi hain.