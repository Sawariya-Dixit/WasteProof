# JunkSnap

**Snap the junk. Prove it. Get it cleared.**

Residents photograph a waste dump. JunkSnap blurs faces and number plates, checks that the photo really shows waste, puts it on a public map, and lets the neighbourhood confirm it. It then finds the ward, MLA seat and MP seat responsible, scores each area, and drafts a cited letter (English or Hindi) that the resident prints and files themselves.

**Live app:** https://waste-swart.vercel.app  · **Pilot area:** Khategaon, Dewas district, Madhya Pradesh

---

## Why this exists

Waste piles up on roads and empty plots for weeks. Three things keep it that way:

- **No proof.** A complaint with no photo, place or time is easy to ignore.
- **Nobody knows who to write to.** Which officer, which MLA, which rule?
- **No tracking, no pressure.** Nobody sees whether a complaint was cleared, and areas are never compared.

People also dump because there is no legal bin nearby. JunkSnap measures all three causes: how fast the city clears waste, how much residents dump, and whether people have anywhere legal to put it.

## What it does

| Step | What happens |
|---|---|
| **1. Snap** | In-app camera, GPS and time saved automatically. Five report types: waste dump, no bin or pickup, overflowing or broken bin, contaminated water, open construction. Works offline (queue retries later). |
| **2. Privacy** | The server blurs faces and number plates first. Only the blurred copy is ever public. The original stays private. |
| **3. AI check** | Rekognition labels and a vision LLM (Groq) each answer yes, no or uncertain. A fixed rule combines them into one probability. Fake or unrelated photos are rejected. |
| **4. Site on the map** | A passed photo becomes a pin showing "1 of N". Same-type reports within 20 m merge into one site (20 to 40 m only if the photos also look alike), so there are no duplicates. |
| **5. Community verification** | A site becomes *verified* only when enough different people back it. The AI alone can never verify a site. Too many "no" votes hide it. |
| **6. Who is responsible** | Point-in-polygon lookup gives the assembly seat (MLA), Lok Sabha seat (MP), district and local body. Nearby schools and hospitals come from OpenStreetMap. |
| **7. Cited letter** | An LLM writes the prose. A verifier checks every quoted rule word for word against the official text. If a quote fails, a template letter with the same verified citations is used. English and Hindi, printable and PDF. Nothing is sent automatically. |
| **8. Area score and ranking** | City response, citizen behaviour and bin access scores per area, with a diagnosis. A score appears only after enough verified reports in that area; counts always show. |
| **9. No-bin zones** | "There is no dustbin within 1 km of me" is a report too. Reports within 500 m join one community zone shown as a circle. |

Also built: cleanup claims with an after-photo, notes on a site with an AI summary, photo flagging, Hindi and English UI, dark mode, installable PWA, and an admin panel (review queue, area import, representatives, queue stats).


## Architecture

```
React PWA (Vite)  ──HTTPS/JSON──>  Express API  ──>  MongoDB Atlas (2dsphere geo indexes)
      │                               │   │
      │ sign in                       │   └──enqueue──>  Redis + BullMQ  ──>  Worker
      ▼                               │                                         │
 AWS Cognito  <──verify ID token──────┘                  moderate · blur · check · verify
                                                         merge site · locate seats
 Cloudinary (private originals,                                    │
 public blurred copies)  <─────────────────────────────────────────┘
                                         Cron: area scores every 15 min
```

The phone never waits for the AI. The API saves the report as `pending` and answers immediately; the worker does the heavy work in the background and the app polls for status. Every pipeline step is idempotent, so a retry cannot double-count. After three failed attempts a report goes to `needs_review` for an admin.

### Stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, React Router, TanStack Query, Zustand, MapLibre GL, Tailwind CSS, react-i18next (Hindi and English), react-hook-form + Zod, aws-amplify (Cognito), idb (offline queue), PWA service worker |
| Backend | Node.js, Express, Mongoose, Zod, aws-jwt-verify, BullMQ + ioredis, sharp, pdfkit, node-cron, pino, helmet, express-rate-limit, bull-board |
| Data | MongoDB Atlas (2dsphere), Redis (Upstash), Cloudinary |
| AI | Amazon Rekognition (moderation, labels, plates), `@vladmandic/human` (faces), Groq vision LLM (judge, letter prose, note summaries) |
| Geo | Nominatim (reverse geocode, cached), Overpass (nearby places), assembly and Lok Sabha GeoJSON from DataMeet |
| Hosting | Vercel (client), Render (API and worker) |

## Rules it holds

- **People verify, models do not.** A model can pass or reject a photo. Only different people backing a site make it verified.
- **Privacy first.** Faces and plates are blurred before any public copy exists. When unsure, it blurs more. EXIF GPS is stripped from public copies. No individual is ever named. Representatives are stored by office and seat, with no party field.
- **No trust in the client.** The server re-checks India bounds, photo age (10 minutes), GPS accuracy, duplicate hash, voter distance and rate limits.
- **Honest letters.** An unverified site's letter says "community verification in progress (N of M confirmed)". If the model calls it verified anyway, the template is used.
- **Honest scores.** Below the minimum number of verified reports the score is withheld; counts always show; no history is invented.
- **Passwords and tokens stay in Cognito.** The API only verifies the ID token. Tokens and raw emails are never logged.

## Project structure

```
JunkSnap/
├── Client/                 React + Vite PWA
│   └── src/  pages/ components/ hooks/ store/ api/ auth/ i18n/ lib/ pwa/
└── Server/                 Node + Express
    ├── config/             defaults.js (every threshold), env.js, redis.js
    ├── models/             Mongoose schemas
    ├── routes/ controllers/ services/ validators/ middleware/
    ├── workers/            report pipeline, notes summary
    ├── jobs/               scores cron, requeue of stuck reports
    ├── ai/                 judges, decision, face and plate scan, letter writer, quote verifier
    ├── scripts/            seed and import scripts
    └── tests/
```

## Run it locally

You need Node 20+, a MongoDB Atlas URI, a Redis URL, a Cognito user pool, a Cloudinary account and a Groq API key.

```bash
# API  (http://localhost:5000)
cd Server
cp .env.example .env        # fill in your own values
npm ci
npm run dev
npm run worker              # in a second terminal (or set EMBEDDED_WORKERS=on)

# Web app
cd Client
cp .env.example .env        # VITE_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID
npm ci
npm run dev
```

First-time data (run once from `Server/`):

```bash
npm run seed:rules          # official rule texts as hashed clauses
npm run seed:reps           # representatives by seat (no party)
npm run seed:bodies         # local bodies and head titles
node scripts/importGeoJSON.js   # assembly, Lok Sabha and district boundaries
npm run make:admin          # make an account an admin
```

Tests: `cd Server && npm test` runs the unit tests (decision logic, scores, quote verifier, geo, hashing, PII filter, site locks).

## Configuration

Every tuning number lives in `Server/config/defaults.js`, and the important ones can be overridden by environment variables.

| Variable | What it controls |
|---|---|
| `VERIFY_THRESHOLD` | How many different people make a site verified (default 5) |
| `AREA_MIN_VERIFIED` | Verified sites needed before an area score is shown (default 10) |
| `SNAPS_PER_HOUR` | Reports per user per hour |
| `PRIVACY_SCAN` | Face and plate scanning mode (`rekognition` in production) |
| `EMBEDDED_WORKERS` | `on` runs the workers inside the API process (one service instead of two) |
| `SCORES_CRON` | Schedule for area scores |
| `BULL_BOARD_USER` / `BULL_BOARD_PASS` | Basic auth for the queue dashboard |

The client reads the two thresholds from the API (`/api/v1/config`), so the numbers on screen always match the server.

## Deploy

- **Client:** Vercel, root directory `Client`, framework Vite. Set `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`.
- **API and worker:** Render, root directory `Server`, build `npm install`, start `npm start`, with `NODE_ENV=production` and `EMBEDDED_WORKERS=on`.
- **Production guard:** in production the server refuses to start with unsafe settings (for example test data counted in scores, or a weak queue dashboard password).
- Add the Vercel domain to the Cognito app client and to `CLIENT_URL`.
- Health check: `GET /healthz`.

## Known limits

- A photo proves that waste exists, not who dumped it. JunkSnap never names a person.
- Ward boundaries are used only where a reviewed ward map exists. Elsewhere, letters and scores use the assembly and Lok Sabha seats.
- The waste judge is a stack of general-purpose vision models. Its accuracy on real photos from Khategaon has **not** been measured, which is why nothing is auto-verified and an admin review queue exists.
- Letters are drafts, not legal advice. The resident files them; nothing is sent automatically.
- Face and plate blur is best-effort. Users can flag a photo that leaked something, and a privacy flag hides the photo straight away.
- Free-tier hosting (Render, Upstash, Atlas) means the first request after idle time can be slow.

## Data sources

Assembly and Lok Sabha boundaries: DataMeet. Map data: OpenStreetMap contributors (ODbL), geocoding via Nominatim, nearby places via Overpass. Rule texts: official Government of India gazette and CPCB documents, stored with a hash and version. Representatives: public sources, stored by office and seat only.

## Team

`Sawariya Dixit` and `Riya Bhati `.


