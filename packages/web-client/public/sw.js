// Service Worker for Iceberg PWA
// Provides offline support and caching

const CACHE_NAME = "iceberg-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/offline.html",
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  cacheFirst: [
    /\/_next\/static\//,
    /\.(?:js|css|woff2?|ttf|eot)$/,
  ],
  // Network first for API calls
  networkFirst: [
    /\/api\//,
    /localhost:8420/,
  ],
  // Stale while revalidate for pages
  staleWhileRevalidate: [
    /\/_next\/data\//,
  ],
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle caching strategies
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Check cache strategies
  if (matchesPattern(url.href, CACHE_STRATEGIES.cacheFirst)) {
    event.respondWith(cacheFirst(event.request));
  } else if (matchesPattern(url.href, CACHE_STRATEGIES.networkFirst)) {
    event.respondWith(networkFirst(event.request));
  } else if (matchesPattern(url.href, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match("/offline.html");
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match("/offline.html");
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
  return cached || fetchPromise;
}
