/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Sync event type declaration for background sync
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

const CACHE_NAME = 'roof-er-command-center-v1';
const STATIC_CACHE = 'roof-er-static-v1';
const DYNAMIC_CACHE = 'roof-er-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (let them go to network)
  if (request.url.includes('/api/') || request.url.includes('/socket.io/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(updateCache(request));
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return offline page if available
          return caches.match('/offline.html').then((offlinePage) => {
            if (offlinePage) {
              return offlinePage;
            }
            // Return a basic offline response
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
        });
    })
  );
});

// Helper function to update cache in background
async function updateCache(request: Request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    console.log('[Service Worker] Failed to update cache:', error);
  }
}

// Message event - for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  console.log('[Service Worker] Background sync:', syncEvent);
  if (syncEvent.tag === 'sync-data') {
    syncEvent.waitUntil(syncData());
  }
});

// Helper function for background sync
async function syncData() {
  try {
    // Implement your background sync logic here
    console.log('[Service Worker] Syncing data...');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

export {};
