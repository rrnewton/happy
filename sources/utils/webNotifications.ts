import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Manages browser notifications for session state changes (web only)
 * Tracks session activity and shows notifications when sessions transition to idle/ready
 */
export class WebNotificationManager {
    private sessionStates = new Map<string, { active: boolean; thinking: boolean }>();

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
     * Track session activity state and notify when transitions to ready
     * @param sessionId - Session identifier
     * @param active - Whether session is actively connected
     * @param thinking - Whether session is processing/thinking
     * @param sessionName - Display name for the session
     */
    handleActivityUpdate(
        sessionId: string,
        active: boolean,
        thinking: boolean,
        sessionName?: string
    ) {
        if (Platform.OS !== 'web') {
            return;
        }

        const previousState = this.sessionStates.get(sessionId);
        const newState = { active, thinking };

        // Detect transition: was thinking -> now idle (ready for input)
        // Session must be active (connected) and transition from thinking to not thinking
        const wasThinking = previousState?.thinking === true;
        const isNowReady = active === true && thinking === false;

        if (wasThinking && isNowReady) {
            // Session just became ready for input!
            this.showNotification(sessionId, sessionName);
        }

        // Update tracked state
        this.sessionStates.set(sessionId, newState);
    }

    /**
     * Show a browser notification for a session that's ready for input
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

    /**
     * Clear all tracked session states
     */
    reset() {
        this.sessionStates.clear();
    }
}

export const webNotificationManager = new WebNotificationManager();
