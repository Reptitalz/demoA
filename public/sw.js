// public/sw.js

const CACHE_NAME = 'heymanito-cache-v1';
// Lista de URLs a cachear. Se debe mantener mínima para la carga inicial.
const urlsToCache = [
  '/',
  '/app',
  '/manifest.json',
  '/icon.svg'
];

// Instala el service worker y cachea los recursos iniciales.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierto.');
        return cache.addAll(urlsToCache);
      })
  );
});

// Sirve las respuestas desde la caché si están disponibles.
self.addEventListener('fetch', event => {
  // Para las peticiones de API, siempre ve a la red.
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Devuelve la respuesta desde la caché.
          return response;
        }
        // Si no está en caché, busca en la red.
        return fetch(event.request);
      })
  );
});

// Escucha las notificaciones push del servidor.
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event sin datos.');
    return;
  }
  const data = event.data.json();
  const title = data.title || 'Hey Manito!';
  const options = {
    body: data.body,
    icon: data.icon || '/android-chrome-192x192.png',
    badge: '/icon.svg', // Icono para la barra de notificaciones de Android
    tag: data.tag,
    data: {
        url: data.url || '/'
    }
  };

  if (data.tag === 'profile-update') {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        if (clients && clients.length) {
            clients.forEach((client) => {
                client.postMessage({ type: 'PROFILE_UPDATED' });
            });
        }
    });
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Maneja el clic en una notificación.
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Revisa si una ventana con la URL de destino ya está abierta.
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === self.location.origin + urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay una ventana abierta, abre una nueva.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
