const CACHE = "victor-coach-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/store.js",
  "./js/ui.js",
  "./js/sheets.js",
  "./js/app.js",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Cache-first para el shell local; red directa para Google APIs (auth/Sheets).
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // deja pasar apis.google.com, accounts.google.com, fonts
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
