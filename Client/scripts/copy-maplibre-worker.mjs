// MapLibre ki worker file ko public/ me copy karta hai.
// Kyun: Vite dev me library pre-bundle hoti hai aur worker ka path toot jata hai.
// public/ ki file Vite bina badle deta hai, dev aur production dono me.
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public', { recursive: true });
copyFileSync(
  'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
  'public/maplibre-gl-worker.mjs',
);
console.log('maplibre worker copied to public/maplibre-gl-worker.mjs');