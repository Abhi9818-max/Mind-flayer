
// Client-side push notification service
// Handles permission requests, subscriptions, and push registration

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported');
    }

    if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not configured');
    }

    try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('Already subscribed to push notifications');
            return subscription;
        }

        // Subscribe to push notifications
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
        });

        console.log('Successfully subscribed to push notifications');
        return subscription;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    if (!isPushSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const successful = await subscription.unsubscribe();
            console.log('Unsubscribed from push notifications:', successful);
            return successful;
        }

        return true;
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
    }
}

/**
 * Save push subscription to server
 */
export async function savePushSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription.toJSON()),
        });

        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }

        console.log('Push subscription saved to server');
        return true;
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return false;
    }
}

/**
 * Delete push subscription from server
 */
export async function deletePushSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
        const response = await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete subscription');
        }

        console.log('Push subscription deleted from server');
        return true;
    } catch (error) {
        console.error('Error deleting push subscription:', error);
        return false;
    }
}

/**
 * Enable push notifications (request permission + subscribe + save)
 */
export async function enablePushNotifications(): Promise<boolean> {
    try {
        // Request permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return false;
        }

        // Subscribe to push
        const subscription = await subscribeToPush();
        if (!subscription) {
            throw new Error('Failed to create subscription');
        }

        // Save to server
        const saved = await savePushSubscription(subscription);
        return saved;
    } catch (error) {
        console.error('Error enabling push notifications:', error);
        return false;
    }
}

/**
 * Disable push notifications (unsubscribe + delete from server)
 */
export async function disablePushNotifications(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            return true;
        }

        // Delete from server first
        await deletePushSubscription(subscription);

        // Then unsubscribe locally
        const unsubscribed = await unsubscribeFromPush();
        return unsubscribed;
    } catch (error) {
        console.error('Error disabling push notifications:', error);
        return false;
    }
}

/**
 * Check if user is currently subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
    if (!isPushSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
    } catch (error) {
        console.error('Error checking push subscription:', error);
        return false;
    }
}
