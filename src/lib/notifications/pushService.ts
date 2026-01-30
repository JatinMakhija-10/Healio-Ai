/**
 * Push Notification Service
 * 
 * Handles browser push notification registration and management.
 * Uses native Web Push API (no third-party service required).
 */

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log(`Notification permission: ${permission}`);
    return permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Subscribe to push notifications
 * 
 * NOTE: In production, you'll need to generate VAPID keys:
 * npx web-push generate-vapid-keys
 */
export async function subscribeToPush(
    registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
    try {
        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('✅ Already subscribed to push notifications');
            return subscription;
        }

        // Subscribe to push notifications
        // TODO: Replace with your VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8-fTnrC7QxKPAz4g4P9fHKfY5vf9DQWJtPZnHWhQqLa1NvJmNP_ZYE';

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as any as BufferSource, // Explicit cast to satisfy TS
        });

        console.log('✅ Subscribed to push notifications');

        // Send subscription to backend
        await saveSubscriptionToBackend(subscription);

        return subscription;
    } catch (error) {
        console.error('❌ Failed to subscribe to push:', error);
        return null;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
    registration: ServiceWorkerRegistration
): Promise<boolean> {
    try {
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            console.log('No subscription found');
            return true;
        }

        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');

        // Remove from backend
        await removeSubscriptionFromBackend(subscription);

        return true;
    } catch (error) {
        console.error('❌ Failed to unsubscribe:', error);
        return false;
    }
}

/**
 * Save push subscription to backend
 */
async function saveSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/push/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        });

        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }

        console.log('✅ Subscription saved to backend');
    } catch (error) {
        console.error('❌ Failed to save subscription:', error);
    }
}

/**
 * Remove push subscription from backend
 */
async function removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/push/unsubscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        });

        if (!response.ok) {
            throw new Error('Failed to remove subscription');
        }

        console.log('✅ Subscription removed from backend');
    } catch (error) {
        console.error('❌ Failed to remove subscription:', error);
    }
}

/**
 * Send a test notification (for debugging)
 */
export async function sendTestNotification(): Promise<void> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    registration.showNotification('Healio.AI Test', {
        body: 'Push notifications are working! 🎉',
        icon: '/healio-icon-192.png',
        badge: '/healio-badge-72.png',
        tag: 'test-notification',
    });
}

/**
 * Helper: Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

/**
 * Initialize push notifications
 * Call this on app load for authenticated users
 */
export async function initializePushNotifications(): Promise<boolean> {
    // Check support
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return false;
    }

    // Check permission
    if (Notification.permission === 'denied') {
        console.warn('Notification permission denied');
        return false;
    }

    try {
        //  Register service worker
        const registration = await registerServiceWorker();
        if (!registration) return false;

        // Subscribe to push if permission granted
        if (Notification.permission === 'granted') {
            await subscribeToPush(registration);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Failed to initialize push notifications:', error);
        return false;
    }
}
