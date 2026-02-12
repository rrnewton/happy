import * as React from 'react';
import { SessionListViewItem, useSessionListViewData, useSetting } from '@/sync/storage';

interface UseVisibleSessionListViewDataOptions {
    /** When true, shows all sessions regardless of hideInactiveSessions setting */
    showAllSessions?: boolean;
}

export function useVisibleSessionListViewData(options?: UseVisibleSessionListViewDataOptions): SessionListViewItem[] | null {
    const data = useSessionListViewData();
    const hideInactiveSessionsSetting = useSetting('hideInactiveSessions');
    const pinnedSessionIds = useSetting('pinnedSessions');

    // Override the setting when showAllSessions is true (e.g., when searching)
    const hideInactiveSessions = options?.showAllSessions ? false : hideInactiveSessionsSetting;

    return React.useMemo(() => {
        if (!data) {
            return data;
        }
        if (!hideInactiveSessions) {
            return data;
        }

        // When hideInactiveSessions is enabled, the server already filters to active sessions
        // via /v2/sessions/active, but we still filter here for:
        // 1. Backwards compatibility
        // 2. Removing empty project groups
        // 3. Edge cases where inactive sessions might be in the list
        // Note: We no longer show pinned sessions if they're inactive (per user preference)

        const filtered: SessionListViewItem[] = [];
        let pendingProjectGroup: SessionListViewItem | null = null;

        for (const item of data) {
            if (item.type === 'project-group') {
                pendingProjectGroup = item;
                continue;
            }

            if (item.type === 'session') {
                // Only show active sessions (pinned sessions are no longer shown if inactive)
                if (item.session.active) {
                    if (pendingProjectGroup) {
                        filtered.push(pendingProjectGroup);
                        pendingProjectGroup = null;
                    }
                    filtered.push(item);
                }
                continue;
            }

            pendingProjectGroup = null;

            if (item.type === 'active-sessions') {
                filtered.push(item);
            }
        }

        return filtered;
    }, [data, hideInactiveSessions, pinnedSessionIds]);
}
