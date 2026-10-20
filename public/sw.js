/**
 * YoReservo BackOffice Service Worker (yoreservo-bo-v1)
 *
 * Strategy:
 * - Install: Precache offline fallback (`/offline.html`) and core PWA icons.
 * - Activate: Purge outdated cache versions and claim active clients.
 * - Fetch:
 *   1. Navigation requests (`mode === "navigate"`): Network-first with `/offline.html` fallback.
 *   2. Static assets (`/_next/static/`, `/icons/`, `/logos/`, fonts): Stale-While-Revalidate.
 *   3. API / Server Action / non-GET requests: Network-only (never cached).
 */

const CACHE_VERSION = "yoreservo-bo-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url, request) {
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/logos/") ||
    url.pathname === "/apple-touch-icon.png"
  ) {
    return true;
  }

  const destination = request.destination;
  return (
    destination === "font" ||
    destination === "style" ||
    destination === "image"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept non-GET requests or Next.js Server Actions
  if (request.method !== "GET" || request.headers.has("Next-Action")) {
    return;
  }

  const url = new URL(request.url);

  // Only handle same-origin HTTP(S) requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache API routes or Next.js RSC flight data fetches
  if (
    url.pathname.startsWith("/api/") ||
    request.headers.get("RSC") === "1"
  ) {
    return;
  }

  // 1. Navigation requests: Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return (
          cachedOffline ||
          new Response("Sin conexión a Internet.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // 2. Static assets: Stale-While-Revalidate
  if (isStaticAsset(url, request)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      }),
    );
  }
});
