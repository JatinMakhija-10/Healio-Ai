// Healio.AI Service Worker for Push Notifications
// Handles push events and displays notifications

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker installed');
    self.skipWait();
});

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(clients.claim());
});

// Handle push notification reception
self.addEventListener('push', (event) => {
    console.log('📬 Push notification received');

    let data = {
        title: 'Healio.AI Notification',
        body: 'You have a new health update',
        icon: '/healio-icon-192.png',
        badge: '/healio-badge-72.png',
        data: {
            url: '/dashboard'
        }
    };

    // Parse notification data if provided
    if (event.data) {
        try {
            const payload = event.data.json();
            data = {
                title: payload.title || data.title,
                body: payload.body || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                data: payload.data || data.data,
                tag: payload.tag || 'healio-notification',
                requireInteraction: payload.requireInteraction || false,
            };
        } catch (e) {
            console.error('Failed to parse push data:', e);
        }
    }

    // Display the notification
    const promise = self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        tag: data.tag,
        requireInteraction: data.requireInteraction,
        actions: [
            { action: 'view', title: 'View', icon: '/icons/view.png' },
            { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
        ],
    });

    event.waitUntil(promise);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((windowClients) => {
            // Check if there's already a window/tab open
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close (optional analytics)
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notification closed');
    // You can track dismissals here if needed
});

// Background sync (optional - for offline  support)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Sync any offline notifications when back online
    console.log('🔄 Syncing notifications');
}
