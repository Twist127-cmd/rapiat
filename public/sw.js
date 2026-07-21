/*
 * Rapiat service worker — conservative, network-first.
 *
 * Goals: make the installed PWA resilient to flaky/absent networks WITHOUT ever
 * serving stale financial data.
 *   - Navigations: network-first; on failure fall back to a cached offline page.
 *   - Static, versioned assets (icons/manifest): cache-first for speed.
 *   - Everything else (APIs, server actions, non-GET): passthrough to network.
 */
const CACHE = "rapiat-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: try the network first, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Precached static assets: serve from cache, refresh in the background.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
