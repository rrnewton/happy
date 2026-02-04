import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSessionPagination } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export const LoadMoreButton = React.memo((props: {
    sessionId: string,
    messageCount: number,
    onLoadMore: () => void
}) => {
    const pagination = useSessionPagination(props.sessionId);
    const { theme } = useUnistyles();

    if (!pagination) return null;

    // All messages loaded state
    if (!pagination.hasMore) {
        return (
            <View style={styles.container}>
                <Text style={styles.allLoadedText(theme)}>
                    Showing all {pagination.totalCount} messages
                </Text>
            </View>
        );
    }

    // Load more available
    const remainingCount = pagination.totalCount - props.messageCount;

    return (
        <View style={styles.container}>
            <Pressable
                onPress={props.onLoadMore}
                disabled={pagination.isLoadingMore}
                style={[
                    styles.button(theme),
                    pagination.isLoadingMore && styles.buttonDisabled
                ]}
            >
                {pagination.isLoadingMore ? (
                    <ActivityIndicator color={theme.colors.background} size="small" />
                ) : (
                    <Text style={styles.buttonText(theme)}>
                        Load older messages ({remainingCount} more)
                    </Text>
                )}
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        padding: 16,
        alignItems: 'center',
    },
    button: (theme: any) => ({
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        minWidth: 200,
        alignItems: 'center',
    }),
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: (theme: any) => ({
        color: theme.colors.background,
        fontSize: 14,
        fontWeight: '600',
    }),
    allLoadedText: (theme: any) => ({
        color: theme.colors.textSecondary,
        fontSize: 13,
    }),
}));
