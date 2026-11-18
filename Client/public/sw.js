// JunkSnap service worker. Maksad: app jaldi khule aur offline me bhi khule (reports queue me jati hain).
// Cache nahi hota: /api/*, doosre origin (map tiles, Cloudinary, API server). Wo seedha network se.
// Naya deploy aaye to VERSION badal do, purane caches activate par hat jate hain.
const VERSION = 'junksnap-v1';
const SHELL = ['/', '/favicon.svg', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const cacheable = (res) => res && res.ok && res.type === 'basic';
const store = (req, res) => {
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy));
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Page kholna: pehle network (taaza index.html), na mile to cache wala
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (cacheable(res)) store('/', res);
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // /assets/* ke naam me hash hota hai, isliye cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (cacheable(res)) store(req, res);
            return res;
          }),
      ),
    );
    return;
  }

  // Baaki (favicon, maplibre worker): cache se turant, peeche se taaza
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (cacheable(res)) store(req, res);
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});