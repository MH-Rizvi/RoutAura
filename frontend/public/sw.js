const CACHE_NAME = 'routeeasy-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found
            if (response) {
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Verify response is valid before caching
                if (
                    !networkResponse ||
                    networkResponse.status !== 200 ||
                    networkResponse.type !== 'basic'
                ) {
                    return networkResponse;
                }

                // Cache the dynamically fetched static assets if it's http/https
                if (event.request.url.startsWith('http')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return networkResponse;
            }).catch(() => {
                // Fallback or do nothing if network fails and not in cache
            });
        })
    );
});
