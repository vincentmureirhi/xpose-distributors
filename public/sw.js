const CACHE_NAME = "xpose-shell-v4";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/xpose-app-icon-v2.svg",
  "/xpose-app-icon-maskable-v2.svg",
  "/xpose-favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept bundled JS/CSS/assets. Vite's modulepreload resources
  // must be fetched by the page directly; caching them through the SW can
  // cause Chrome "cross-world service worker resource mismatch" warnings.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/assets/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put("/", copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          try {
            const cached = await caches.match("/");
            return cached || Response.error();
          } catch {
            return Response.error();
          }
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          try {
            const fallback = await caches.match("/");
            return fallback || Response.error();
          } catch {
            return Response.error();
          }
        });
    })
  );
});
