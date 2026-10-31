# JunkSnap Client (React + Vite)

## Chalane ka tareeka

```bash
cd Client
npm install
cp .env.example .env      # phir values bharo (kabhi commit mat karna)
npm run dev               # http://localhost:5173
```

Server alag terminal me chalna chahiye (`cd Server && npm run dev`), aur Server ke `.env` me
`CLIENT_URL=http://localhost:5173` hona chahiye (CORS).

## .env (naam hi, values nahi)

VITE_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID

## Cognito me ye settings zaroori hain

- App client **bina client secret** ka ho (public client, browser me secret nahi chhup sakta).
- App client me **ALLOW_USER_SRP_AUTH** (aur ALLOW_REFRESH_TOKEN_AUTH) enabled ho.
- Sign-in option = **Email**; email verification ka code Cognito bheje.
- Password policy: 8+ chars, capital, small, number, special (src/auth/schemas.js me wahi rules hain).
- User pool aur client wahi ho jo Server ke .env me hai (COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID).

## Stack

React 19, Vite, React Router, Tailwind CSS v4, aws-amplify (Cognito), axios, TanStack Query,
Zustand, react-i18next (en/hi), react-hook-form + Zod, lucide-react, maplibre-gl (Day 4 se).

## Folder structure

```
src/
  api/         axios client (ID token interceptor, error format), users.js
  auth/        cognito.js (Amplify), schemas.js (Zod), ProtectedRoute.jsx
  components/  layout/ (AppShell, TopBar, BottomNav, ThemeToggle, LanguageSwitch), ui/
  hooks/       useAuth
  i18n/        index.js, en.json, hi.json
  pages/       MapPage, SnapPage, ... auth/ (login, register, verify, forgot)
  pwa/         (Day 24: manifest + service worker)
  store/       authStore, uiStore (theme + language, localStorage me)
  styles/      index.css (Tailwind)
```

## Routes

| Route | Access | Status |
|---|---|---|
| / (map), /site/:id, /areas, /area/:id, /about | public | placeholder (about ready) |
| /snap, /letter/:id, /activity, /account | login zaroori | placeholder (account ready) |
| /admin/* | sirf admin | placeholder |
| /login, /register, /verify, /forgot-password | sirf guest | ready |

## Naye page ka tareeka

1. src/pages/ me page banao.
2. src/App.jsx me Route add karo (public / ProtectedRoute / admin ke andar).
3. Text hamesha t('...') se, en.json aur hi.json dono me key daalo.
