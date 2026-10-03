/* ============================================
   AdminGo — Service Worker (PWA offline)
   ============================================
   Stratégie : cache-first avec versionnement.
   Pour forcer une mise à jour, incrémenter CACHE_VERSION.
   ============================================ */

const CACHE_VERSION = 'admingo-v9';

const PRECACHE_URLS = [
    './',
    './index.html',
    './app.js',
    './particles.js',
    './styles.css',
    './database.csv',
    './logo.png',
    './manifest.json',
    './mentions-legales.html',
];

// ============================================
// INSTALL : précache les ressources locales
// ============================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
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
// FETCH : cache-first, fallback réseau + cache runtime
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                // Ne pas cacher les réponses en erreur ou opaques invalides
                if (!response || response.status !== 200) return response;

                // Cache runtime pour les CDN et polices Google (vérification stricte de l'hôte)
                let hostname = '';
                try {
                    hostname = new URL(request.url).hostname;
                } catch {
                    return response;
                }

                const allowedHosts = [
                    'cdn.tailwindcss.com',
                    'cdnjs.cloudflare.com',
                    'fonts.googleapis.com',
                    'fonts.gstatic.com',
                ];

                const shouldCache = allowedHosts.includes(hostname);

                if (shouldCache) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                }

                return response;
            }).catch(() => {
                // Hors-ligne et pas en cache : pas de fallback possible
                return new Response('Offline', { status: 503, statusText: 'Offline' });
            });
        })
    );
});
