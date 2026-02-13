// Service Worker for Mind-Flayer PWA
// Handles push notifications and background sync

const CACHE_NAME = 'mind-flayer-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(self.clients.claim());
});

// Push event - receives push notifications from server
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    let notificationData = {
        title: 'Mind-Flayer',
        body: 'You have a new notification',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'default',
        data: {}
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                title: payload.title || notificationData.title,
                body: payload.body || notificationData.body,
                icon: payload.icon || notificationData.icon,
                badge: payload.badge || notificationData.badge,
                tag: payload.tag || notificationData.tag,
                data: payload.data || {},
                requireInteraction: payload.requireInteraction || false,
            };
        } catch (e) {
            console.error('[SW] Error parsing push payload:', e);
            notificationData.body = event.data.text();
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            requireInteraction: notificationData.requireInteraction,
            vibrate: [200, 100, 200],
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event - handles when user clicks notification
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/notifications';

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // Check if there's already a window open
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url.includes(self.location.origin) && 'focus' in client) {
                return client.focus().then(client => {
                    if ('navigate' in client) {
                        return client.navigate(urlToOpen);
                    }
                });
            }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

// Background sync (optional - for future use)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Placeholder for future background sync logic
    console.log('[SW] Syncing notifications...');
}
