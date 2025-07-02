// public/sw.js

self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push received...', data);

  const title = data.title || 'Nueva Notificación';
  const options = {
    body: data.body || 'Tienes una nueva actualización.',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    data: {
      url: data.url || '/dashboard'
    }
  };

  // Show the notification
  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);

  // If there's a specific tag, broadcast a message to active clients
  if (data.tag && data.tag === 'profile-update') {
    event.waitUntil(
      self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then(clientList => {
        for (const client of clientList) {
          console.log('Posting message to client:', client.id);
          client.postMessage({ type: 'PROFILE_UPDATED' });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
