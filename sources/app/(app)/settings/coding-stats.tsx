import { memo, useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { WakapiStatsPanel } from '@/components/wakapi/WakapiStatsPanel';
import { useWakapiConfigured } from '@/hooks/useWakapiStats';

function CodingStatsScreen() {
    const isConfigured = useWakapiConfigured();

    // Redirect to settings if not configured
    if (!isConfigured) {
        return <Redirect href="/settings/wakapi" />;
    }

    return <WakapiStatsPanel />;
}

export default memo(CodingStatsScreen);
