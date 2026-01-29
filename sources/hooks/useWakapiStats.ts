import * as React from 'react';
import { useSetting } from '@/sync/storage';
import { fetchWakapiStats, WakapiStats, WakapiRange } from '@/sync/apiWakapi';

/**
 * Hook to fetch and cache Wakapi coding statistics.
 *
 * Automatically fetches stats when Wakapi is enabled and configured.
 * Provides loading/error states and manual refresh capability.
 * Caches results in memory and refreshes on mount or when range changes.
 */
export function useWakapiStats(range: WakapiRange = 'last_7_days') {
    const wakapiEnabled = useSetting('wakapiEnabled');
    const wakapiApiUrl = useSetting('wakapiApiUrl');
    const wakapiApiKey = useSetting('wakapiApiKey');

    const [stats, setStats] = React.useState<WakapiStats | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const isConfigured = wakapiEnabled && !!wakapiApiUrl && !!wakapiApiKey;

    const refresh = React.useCallback(async () => {
        if (!isConfigured) {
            setStats(null);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await fetchWakapiStats(range);
            setStats(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch stats');
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [isConfigured, range]);

    // Fetch on mount and when dependencies change
    React.useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        stats,
        loading,
        error,
        refresh,
        isConfigured,
    };
}

/**
 * Hook to check if Wakapi is configured and ready to use
 */
export function useWakapiConfigured(): boolean {
    const wakapiEnabled = useSetting('wakapiEnabled');
    const wakapiApiUrl = useSetting('wakapiApiUrl');
    const wakapiApiKey = useSetting('wakapiApiKey');

    return wakapiEnabled && !!wakapiApiUrl && !!wakapiApiKey;
}
