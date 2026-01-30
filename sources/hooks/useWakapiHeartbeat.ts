import * as React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSetting } from '@/sync/storage';
import { sendHeartbeat, createSessionHeartbeat, getWakapiConfig } from '@/sync/apiWakapi';
import { loadWakapiLastHeartbeat, saveWakapiLastHeartbeat } from '@/sync/persistence';

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (WakaTime default)
const MIN_HEARTBEAT_INTERVAL_MS = 30 * 1000; // Don't send more than once per 30 seconds

/**
 * Hook to track time spent in a Happy session and submit heartbeats to Wakapi.
 *
 * Sends heartbeats every 2 minutes while the session is active and the app is in foreground.
 * Heartbeats are only sent if Wakapi is configured and heartbeat submission is enabled.
 *
 * Uses MMKV to store the last heartbeat timestamp globally, preventing duplicate heartbeats
 * when rapidly switching between sessions.
 *
 * @param sessionPath - The current working directory of the session
 * @param projectName - The name of the project (derived from folder name)
 * @param machineName - The hostname of the machine (optional, for better tracking)
 * @param isActive - Whether the session is currently active/visible
 */
export function useWakapiHeartbeat(
    sessionPath: string | null,
    projectName: string | null,
    machineName: string | null,
    isActive: boolean,
    flavor?: string | null,
) {
    const wakapiEnabled = useSetting('wakapiEnabled');

    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const shouldSendHeartbeats = wakapiEnabled && isActive && sessionPath && projectName;

    const sendHeartbeatIfNeeded = React.useCallback(async () => {
        if (!shouldSendHeartbeats || !sessionPath || !projectName) {
            return;
        }

        const now = Date.now();

        // Check the globally shared last heartbeat time from MMKV
        const lastHeartbeat = loadWakapiLastHeartbeat();
        if (now - lastHeartbeat < MIN_HEARTBEAT_INTERVAL_MS) {
            return;
        }

        // Check if Wakapi is configured
        const config = getWakapiConfig();
        if (!config) {
            return;
        }

        // Create and send heartbeat
        const heartbeat = createSessionHeartbeat(sessionPath, projectName, machineName || undefined, flavor || undefined);
        const success = await sendHeartbeat(heartbeat);

        if (success) {
            // Update the global last heartbeat time in MMKV
            saveWakapiLastHeartbeat(now);
        }
    }, [shouldSendHeartbeats, sessionPath, projectName, machineName, flavor]);

    // Send heartbeat when session becomes active
    React.useEffect(() => {
        if (shouldSendHeartbeats) {
            sendHeartbeatIfNeeded();
        }
    }, [shouldSendHeartbeats, sendHeartbeatIfNeeded]);

    // Set up interval for periodic heartbeats
    React.useEffect(() => {
        if (!shouldSendHeartbeats) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Send heartbeats periodically
        intervalRef.current = setInterval(() => {
            sendHeartbeatIfNeeded();
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [shouldSendHeartbeats, sendHeartbeatIfNeeded]);

    // Handle app state changes (pause when backgrounded)
    React.useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && shouldSendHeartbeats) {
                // App came to foreground, send a heartbeat
                sendHeartbeatIfNeeded();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [shouldSendHeartbeats, sendHeartbeatIfNeeded]);

    // Return a function to manually trigger a heartbeat (e.g., on user interaction)
    return {
        sendHeartbeat: sendHeartbeatIfNeeded,
    };
}
