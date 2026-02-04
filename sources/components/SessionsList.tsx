import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text } from '@/components/StyledText';
import { usePathname } from 'expo-router';
import { SessionListViewItem } from '@/sync/storage';
import { sessionMatchesSearch } from '@/utils/sessionSearch';
import { ActiveSessionsGroup, FlatSessionRow } from './ActiveSessionsGroup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVisibleSessionListViewData } from '@/hooks/useVisibleSessionListViewData';
import { Typography } from '@/constants/Typography';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useIsTablet } from '@/utils/responsive';
import { requestReview } from '@/utils/requestReview';
import { layout } from './layout';
import { sync } from '@/sync/sync';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: theme.colors.groupped.background,
    },
    contentContainer: {
        flex: 1,
        maxWidth: layout.maxWidth,
    },
    headerSection: {
        backgroundColor: theme.colors.groupped.background,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 8,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.groupped.sectionTitle,
        letterSpacing: 0.1,
        ...Typography.default('semiBold'),
    },
    projectGroup: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.surface,
    },
    projectGroupTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    projectGroupSubtitle: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
        ...Typography.default(),
    },
}));

interface SessionsListProps {
    searchQuery?: string;
}

export function SessionsList({ searchQuery = '' }: SessionsListProps) {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const safeArea = useSafeAreaInsets();
    // When searching, show all sessions (including archived) regardless of hideInactiveSessions setting
    const isSearching = searchQuery.trim().length > 0;
    const rawData = useVisibleSessionListViewData({ showAllSessions: isSearching });
    const pathname = usePathname();
    const isTablet = useIsTablet();
    const selectable = isTablet;
    const selectedSessionId = React.useMemo(() => {
        if (isTablet && pathname.startsWith('/session/')) {
            const parts = pathname.split('/');
            return parts[2];
        }
        return undefined;
    }, [isTablet, pathname]);

    // Pull-to-refresh state
    const [refreshing, setRefreshing] = React.useState(false);
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await sync.refreshSessions();
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Filter data based on search query (local filtering)
    // Supports OR syntax with '|' separator (e.g., "foo|bar")
    const data = React.useMemo(() => {
        if (!rawData || !searchQuery.trim()) {
            return rawData;
        }

        // Filter sessions (flat list, no headers)
        const filteredItems: SessionListViewItem[] = [];

        for (const item of rawData) {
            if (item.type === 'session') {
                if (sessionMatchesSearch(item.session, searchQuery)) {
                    filteredItems.push(item);
                }
            } else if (item.type === 'active-sessions') {
                const filteredSessions = item.sessions.filter(session =>
                    sessionMatchesSearch(session, searchQuery)
                );

                if (filteredSessions.length > 0) {
                    filteredItems.push({
                        ...item,
                        sessions: filteredSessions,
                    });
                }
            } else {
                filteredItems.push(item);
            }
        }

        return filteredItems;
    }, [rawData, searchQuery]);

    const dataWithSelected = selectable ? React.useMemo(() => {
        return data?.map(item => ({
            ...item,
            selected: pathname.startsWith(`/session/${item.type === 'session' ? item.session.id : ''}`)
        }));
    }, [data, pathname]) : data;

    // Request review
    React.useEffect(() => {
        if (data && data.length > 0) {
            requestReview();
        }
    }, [data && data.length > 0]);

    // Early return if no data yet
    if (!data) {
        return (
            <View style={styles.container} />
        );
    }

    const keyExtractor = React.useCallback((item: SessionListViewItem & { selected?: boolean }, index: number) => {
        switch (item.type) {
            case 'header': return `header-${item.title}-${index}`;
            case 'active-sessions': return 'active-sessions';
            case 'project-group': return `project-group-${item.machine.id}-${item.displayPath}-${index}`;
            case 'session': return `session-${item.session.id}`;
        }
    }, []);

    const renderItem = React.useCallback(({ item }: { item: SessionListViewItem & { selected?: boolean } }) => {
        switch (item.type) {
            case 'header':
                // Headers no longer used, but keeping for backward compatibility
                return (
                    <View style={styles.headerSection}>
                        <Text style={styles.headerText}>
                            {item.title}
                        </Text>
                    </View>
                );

            case 'active-sessions':
                return (
                    <ActiveSessionsGroup
                        sessions={item.sessions}
                        selectedSessionId={selectedSessionId}
                    />
                );

            case 'project-group':
                return (
                    <View style={styles.projectGroup}>
                        <Text style={styles.projectGroupTitle}>
                            {item.displayPath}
                        </Text>
                        <Text style={styles.projectGroupSubtitle}>
                            {item.machine.metadata?.displayName || item.machine.metadata?.host || item.machine.id}
                        </Text>
                    </View>
                );

            case 'session':
                return (
                    <FlatSessionRow
                        session={item.session}
                        selected={item.selected}
                    />
                );
        }
    }, [dataWithSelected, selectedSessionId]);


    // Remove this section as we'll use FlatList for all items now


    const HeaderComponent = React.useCallback(() => {
        return (
            <View>
                {/* <View style={{ marginHorizontal: -4 }}>
                    <UpdateBanner />
                </View> */}
            </View>
        );
    }, []);

    // Footer removed - all sessions now shown inline

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <FlatList
                    data={dataWithSelected}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ paddingBottom: safeArea.bottom + 128, maxWidth: layout.maxWidth }}
                    ListHeaderComponent={HeaderComponent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.textSecondary}
                        />
                    }
                />
            </View>
        </View>
    );
}
