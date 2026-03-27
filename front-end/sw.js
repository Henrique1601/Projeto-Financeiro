const CACHE_NAME = 'gestor-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/modern.css',
  './js/main.js',
  './login/login.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.origin.includes('vercel.app') || url.origin.includes('localhost')) {
    if (!url.pathname.includes('/api/')) {
      event.respondWith(
        caches.match(event.request)
          .then(response => response || fetch(event.request).catch(() => null))
      );
    }
  }
});
