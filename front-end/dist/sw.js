const CACHE = 'gestor-v3';
const API_CACHE = 'gestor-api-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  // Ignorar requests que não são GET (ex: HEAD, POST)
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // API calls: network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Static assets: cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request));
  }
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(API_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
