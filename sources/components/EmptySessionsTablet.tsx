import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useAllMachines } from '@/sync/storage';
import { isMachineOnline } from '@/utils/machineUtils';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 48,
    },
    iconContainer: {
        marginBottom: 24,
    },
    titleText: {
        fontSize: 20,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
        ...Typography.default('regular'),
    },
    descriptionText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        ...Typography.default(),
    },
}));

export function EmptySessionsTablet() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const machines = useAllMachines();

    const hasOnlineMachines = React.useMemo(() => {
        return machines.some(machine => isMachineOnline(machine));
    }, [machines]);

    return (
        <View style={styles.container}>
            <Ionicons
                name="terminal-outline"
                size={64}
                color={theme.colors.textSecondary}
                style={styles.iconContainer}
            />

            <Text style={styles.titleText}>
                No active sessions
            </Text>

            {hasOnlineMachines ? (
                <Text style={styles.descriptionText}>
                    Start a new session on any of your connected machines.
                </Text>
            ) : (
                <Text style={styles.descriptionText}>
                    Open a new terminal on your computer to start session.
                </Text>
            )}
        </View>
    );
}