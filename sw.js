/* ============================================
   AdminGo — Service Worker (PWA offline)
   ============================================
   Stratégie : cache-first avec versionnement.
   Pour forcer une mise à jour, incrémenter CACHE_VERSION.
   ============================================ */

const CACHE_VERSION = 'admingo-v1';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/particles.js',
    '/styles.css',
    '/database.csv',
    '/logo.png',
    '/manifest.json',
    '/mentions-legales.html',
];

const PRECACHE_CORS_URLS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
];

// ============================================
// INSTALL : précache toutes les ressources
// ============================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(async (cache) => {
            // Ressources locales (same-origin)
            await cache.addAll(PRECACHE_URLS);

            // Ressources cross-origin (CORS)
            await Promise.all(
                PRECACHE_CORS_URLS.map(async (url) => {
                    const response = await fetch(url, { mode: 'cors' });
                    await cache.put(url, response);
                })
            );
        }).then(() => self.skipWaiting())
    );
});

// ============================================
// ACTIVATE : supprime les anciens caches
// ============================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ============================================
// FETCH : cache-first, fallback réseau
// ============================================
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((response) => {
                // Cache les polices Google Fonts (.woff2) au premier chargement
                if (response.ok && event.request.url.includes('fonts.gstatic.com')) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
