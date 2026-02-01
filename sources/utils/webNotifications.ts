import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Manages browser notifications for session ready events (web only)
 * Shows notifications when the server detects a session is ready for input
 */
export class WebNotificationManager {
    /**
     * Request browser notification permission
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS !== 'web' || !('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Get current permission status
     */
    getPermission(): NotificationPermission | 'unsupported' {
        if (Platform.OS !== 'web' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Show a browser notification for a session that's ready for input
     * Called when the server sends a notification event via WebSocket
     */
    showNotification(sessionId: string, sessionName?: string) {
        if (Platform.OS !== 'web' || Notification.permission !== 'granted') {
            return;
        }

        const title = 'Session Ready';
        const body = sessionName || 'Your coding session is waiting for input';

        try {
            const notification = new Notification(title, {
                body,
                icon: '/icon.png',
                tag: sessionId, // Prevents duplicate notifications
                requireInteraction: false,
                silent: false,
            });

            notification.onclick = () => {
                window.focus();
                router.push(`/session/${sessionId}`);
                notification.close();
            };
        } catch (error) {
            console.error('[WebNotifications] Failed to create notification:', error);
        }
    }
}

export const webNotificationManager = new WebNotificationManager();
