import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }, // import x from '@/store/...'
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // sirf dev: tunnel (trycloudflare / ngrok) ke host naam allow
    // /api ko vite hi server (localhost:5000) tak pahuncha deta hai, to phone ko sirf ek HTTPS link chahiye
    // aur CORS ki zaroorat nahi
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});