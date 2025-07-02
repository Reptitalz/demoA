'use strict';

self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || 'Hey Manito!';
  const options = {
    body: data.body,
    icon: '/apple-icon.png',
    badge: '/icon.svg',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
