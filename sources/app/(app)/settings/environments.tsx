import React, { useCallback, memo } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Item } from '@/components/Item';
import { Text } from '@/components/StyledText';
import { useSettingMutable } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import type { EnvironmentSet } from '@/sync/settings';
import { useRouter } from 'expo-router';


function EnvironmentsSettingsScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const [environmentSets, setEnvironmentSets] = useSettingMutable('environmentSets');

    const handleAddNew = useCallback(() => {
        router.push('/settings/environment-edit?id=new');
    }, [router]);

    const handleEdit = useCallback((envSet: EnvironmentSet) => {
        router.push(`/settings/environment-edit?id=${envSet.id}`);
    }, [router]);

    const handleToggleDefault = useCallback((envSet: EnvironmentSet) => {
        // Multiple sets can have applyByDefault=true
        setEnvironmentSets(environmentSets.map(e => ({
            ...e,
            applyByDefault: e.id === envSet.id ? !e.applyByDefault : e.applyByDefault,
        })));
    }, [environmentSets, setEnvironmentSets]);

    // Format variables for display
    const formatVariables = (variables: Record<string, string>): string => {
        const keys = Object.keys(variables);
        if (keys.length === 0) return t('settingsEnvironments.noVariables');
        if (keys.length <= 2) return keys.join(', ');
        return `${keys.slice(0, 2).join(', ')} +${keys.length - 2}`;
    };

    return (
        <ItemList style={{ paddingTop: 0 }}>
            <ItemGroup
                title={t('settingsEnvironments.title')}
                footer={t('settingsEnvironments.description')}
            >
                {environmentSets.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                            {t('settingsEnvironments.empty')}
                        </Text>
                    </View>
                ) : (
                    environmentSets.map((envSet, index) => (
                        <Item
                            key={envSet.id}
                            title={envSet.name}
                            subtitle={formatVariables(envSet.variables)}
                            leftElement={
                                <Pressable onPress={() => handleToggleDefault(envSet)} hitSlop={8}>
                                    <Ionicons
                                        name={envSet.applyByDefault ? "star" : "star-outline"}
                                        size={20}
                                        color={envSet.applyByDefault ? "#FFD700" : theme.colors.textSecondary}
                                    />
                                </Pressable>
                            }
                            onPress={() => handleEdit(envSet)}
                            showDivider={index < environmentSets.length - 1}
                        />
                    ))
                )}
            </ItemGroup>

            <ItemGroup>
                <Item
                    title={t('settingsEnvironments.addNew')}
                    icon={<Ionicons name="add-circle-outline" size={29} color={theme.colors.textLink} />}
                    onPress={handleAddNew}
                    showChevron={false}
                />
            </ItemGroup>

            <ItemGroup footer={t('settingsEnvironments.helpText')}>
                <View style={[styles.helpContainer, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                    <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                        {t('settingsEnvironments.tipText')}
                    </Text>
                </View>
            </ItemGroup>
        </ItemList>
    );
}

export default memo(EnvironmentsSettingsScreen);

const styles = StyleSheet.create((theme) => ({
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        ...Typography.default(),
        fontSize: 14,
    },
    helpContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    helpText: {
        ...Typography.default(),
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
}));
