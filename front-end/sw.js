const CACHE_NAME = 'gestor-v2';
const STATIC_CACHE = 'gestor-static-v2';
const DATA_CACHE = 'gestor-data-v2';

const STATIC_URLS = [
  './',
  './index.html',
  './css/modern.css',
  './css/Login.css',
  './js/main.js',
  './js/config.js',
  './js/api.js',
  './js/auth.js',
  './js/financeiro.js',
  './js/events.js',
  './js/table.js',
  './js/export.js',
  './js/formatters.js',
  './js/utils.js',
  './login/login.html',
  './login/login.js',
  './login/register.js',
  './extrato/extrato.html',
  './extrato/extrato.js',
  './Esqueci a senha/Senha.html',
  './Esqueci a senha/esqueci.js',
  './Esqueci a senha/esqueci.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  'https://cdn.jsdelivr.net/npm/toastify-js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_URLS).catch(err => {
          console.log('[SW] Some static assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DATA_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET') return;

  if (url.origin.includes('vercel') || url.origin.includes('localhost')) {
    if (url.pathname.includes('/api/')) {
      event.respondWith(networkFirst(event.request, DATA_CACHE));
      return;
    }
    
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return caches.match(request).then(cached => {
      if (cached) return cached;
      return new Response('Offline - recurso não disponível', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ error: 'offline', message: 'Você está offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Syncing data...');
}

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Gestor Financeiro',
    icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gestor Financeiro', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url.includes('index.html') && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('./index.html');
          }
        })
    );
  }
});
