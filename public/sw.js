// public/sw.js

// Listener for the install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting so the new service worker becomes active immediately
  event.waitUntil(self.skipWaiting());
});

// Listener for the activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Listener for push events from the server
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  let pushData;
  try {
    pushData = event.data.json();
  } catch (e) {
    console.error('Service Worker: Failed to parse push data.', e);
    pushData = {
      title: 'Nueva Notificación',
      body: 'Has recibido una nueva actualización.',
    };
  }

  const { title, body, icon, url, tag } = pushData;

  const options = {
    body: body,
    icon: icon || '/icon.svg', // Default icon
    badge: '/icon.svg', // Icon for the notification tray on Android
    vibrate: [200, 100, 200], // Vibration pattern
    tag: tag || 'default-tag', // A tag to group notifications
    data: {
      url: url || '/', // URL to open on click
    },
    requireInteraction: false,
  };

  // Show the notification
  event.waitUntil(self.registration.showNotification(title, options));

  // Also send a message to any open clients to notify them of the update
  if (tag === 'profile-update') {
      event.waitUntil(
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
              for (const client of clientList) {
                  client.postMessage({ type: 'PROFILE_UPDATED' });
              }
          })
      );
  }
});


// Listener for notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked.');
  
  // Close the notification
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  // This looks for an existing window/tab and focuses it, otherwise opens a new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's a window open with the same URL
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
