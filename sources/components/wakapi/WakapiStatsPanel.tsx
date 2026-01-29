import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/StyledText';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ItemGroup } from '@/components/ItemGroup';
import { UsageBar } from '@/components/usage/UsageBar';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/text';
import { layout } from '@/components/layout';
import { useWakapiStats } from '@/hooks/useWakapiStats';
import { WakapiRange, WakapiStatsItem } from '@/sync/apiWakapi';
import { useRouter } from 'expo-router';

type TimePeriod = 'today' | 'last_7_days' | 'last_30_days';

const periodToRange: Record<TimePeriod, WakapiRange> = {
    'today': 'today',
    'last_7_days': 'last_7_days',
    'last_30_days': 'last_30_days',
};

/**
 * Panel displaying Wakapi coding statistics.
 * Shows time breakdown by project, language, editor, and machine.
 */
export const WakapiStatsPanel: React.FC = () => {
    const { theme } = useUnistyles();
    const router = useRouter();
    const [period, setPeriod] = useState<TimePeriod>('last_7_days');

    const { stats, loading, error, refresh, isConfigured } = useWakapiStats(periodToRange[period]);

    const periodLabels: Record<TimePeriod, string> = {
        'today': t('usage.today'),
        'last_7_days': t('usage.last7Days'),
        'last_30_days': t('usage.last30Days'),
    };

    // Not configured - show setup prompt
    if (!isConfigured) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={64} color={theme.colors.textSecondary} />
                <Text style={styles.emptyTitle}>{t('settingsWakapi.notConfigured')}</Text>
                <Text style={styles.emptySubtitle}>{t('settingsWakapi.setupPrompt')}</Text>
                <Pressable
                    style={styles.setupButton}
                    onPress={() => router.push('/settings/wakapi')}
                >
                    <Text style={styles.setupButtonText}>{t('settingsWakapi.configure')}</Text>
                </Pressable>
            </View>
        );
    }

    // Loading state
    if (loading && !stats) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={refresh}>
                    <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </Pressable>
            </View>
        );
    }

    if (!stats) {
        return null;
    }

    // Get top items for each category
    const topProjects = stats.projects?.slice(0, 5) || [];
    const topLanguages = stats.languages?.slice(0, 5) || [];
    const topEditors = stats.editors?.slice(0, 3) || [];
    const topMachines = stats.machines?.slice(0, 3) || [];

    const maxProjectSeconds = Math.max(...topProjects.map(p => p.total_seconds), 1);
    const maxLanguageSeconds = Math.max(...topLanguages.map(l => l.total_seconds), 1);
    const maxEditorSeconds = Math.max(...topEditors.map(e => e.total_seconds), 1);
    const maxMachineSeconds = Math.max(...topMachines.map(m => m.total_seconds), 1);

    const formatTime = (item: WakapiStatsItem): string => {
        return item.text || `${item.hours}h ${item.minutes}m`;
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#10B981" />
            }
        >
            <View style={{ alignItems: 'center' }}>
                <View style={{ width: '100%', maxWidth: layout.maxWidth }}>
                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        {(['today', 'last_7_days', 'last_30_days'] as TimePeriod[]).map((p) => (
                            <Pressable
                                key={p}
                                style={[styles.periodButton, period === p && styles.periodButtonActive]}
                                onPress={() => setPeriod(p)}
                            >
                                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                                    {periodLabels[p]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Summary Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('settingsWakapi.totalTime')}</Text>
                            <Text style={styles.statValue}>{stats.human_readable_total}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('settingsWakapi.dailyAverage')}</Text>
                            <Text style={styles.statValue}>{stats.human_readable_daily_average}</Text>
                        </View>
                    </View>

                    {/* Projects */}
                    {topProjects.length > 0 && (
                        <ItemGroup title={t('settingsWakapi.projects')}>
                            <View style={{ padding: 16 }}>
                                {topProjects.map((project) => (
                                    <UsageBar
                                        key={project.name}
                                        label={project.name}
                                        value={project.total_seconds}
                                        maxValue={maxProjectSeconds}
                                        color="#10B981"
                                        showPercentage={false}
                                    />
                                ))}
                            </View>
                        </ItemGroup>
                    )}

                    {/* Languages */}
                    {topLanguages.length > 0 && (
                        <ItemGroup title={t('settingsWakapi.languages')}>
                            <View style={{ padding: 16 }}>
                                {topLanguages.map((language) => (
                                    <UsageBar
                                        key={language.name}
                                        label={language.name}
                                        value={language.total_seconds}
                                        maxValue={maxLanguageSeconds}
                                        color="#6366F1"
                                        showPercentage={false}
                                    />
                                ))}
                            </View>
                        </ItemGroup>
                    )}

                    {/* Editors */}
                    {topEditors.length > 0 && (
                        <ItemGroup title={t('settingsWakapi.editors')}>
                            <View style={{ padding: 16 }}>
                                {topEditors.map((editor) => (
                                    <UsageBar
                                        key={editor.name}
                                        label={editor.name}
                                        value={editor.total_seconds}
                                        maxValue={maxEditorSeconds}
                                        color="#F59E0B"
                                        showPercentage={false}
                                    />
                                ))}
                            </View>
                        </ItemGroup>
                    )}

                    {/* Machines */}
                    {topMachines.length > 0 && (
                        <ItemGroup title={t('settingsWakapi.machines')}>
                            <View style={{ padding: 16 }}>
                                {topMachines.map((machine) => (
                                    <UsageBar
                                        key={machine.name}
                                        label={machine.name}
                                        value={machine.total_seconds}
                                        maxValue={maxMachineSeconds}
                                        color="#EC4899"
                                        showPercentage={false}
                                    />
                                ))}
                            </View>
                        </ItemGroup>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    periodSelector: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#10B981',
    },
    periodText: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
    },
    periodTextActive: {
        color: '#FFFFFF',
    },
    statsContainer: {
        padding: 16,
        backgroundColor: theme.colors.surface,
        margin: 16,
        borderRadius: 12,
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: theme.colors.status.error,
        textAlign: 'center',
    },
    retryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 14,
        color: theme.colors.textLink,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    setupButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#10B981',
        borderRadius: 8,
        marginTop: 8,
    },
    setupButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
}));
