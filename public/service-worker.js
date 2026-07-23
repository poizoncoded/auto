/* global self, caches, fetch, URL */

const cachePrefix = "auto-spendings-";
const cacheName = `${cachePrefix}static-v3`;
const shellAssets = ["/offline.html", "/manifest.webmanifest", "/bg.png", "/pwa-192.png", "/pwa-512.png"];
const viteDevPrefixes = ["/@vite/", "/src/", "/node_modules/.vite/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(shellAssets)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((existingCacheName) => existingCacheName.startsWith(cachePrefix) && existingCacheName !== cacheName)
            .map((existingCacheName) => caches.delete(existingCacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (viteDevPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    return;
  }

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  const cacheableDestinations = new Set(["font", "image", "manifest", "script", "style"]);

  if (!cacheableDestinations.has(request.destination)) {
    return;
  }

  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response.clone());
          }

          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        return cached;
      }

      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
      }

      return response;
    })
  );
});
