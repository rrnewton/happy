import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { Typography } from '@/constants/Typography';
import { useSetting } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { MultiTextInput, MultiTextInputHandle } from '@/components/MultiTextInput';
import type { EnvironmentSet } from '@/sync/settings';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: layout.maxWidth,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        ...Typography.default(),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    searchInput: {
        flex: 1,
        backgroundColor: theme.colors.input.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        minHeight: 36,
        position: 'relative',
        borderWidth: 0.5,
        borderColor: theme.colors.divider,
    },
    searchInputInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInputText: {
        flex: 1,
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    customVarsContainer: {
        backgroundColor: theme.colors.surface,
        padding: 16,
    },
    customVarsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customVarsTitle: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        color: theme.colors.textSecondary,
        letterSpacing: 0.5,
    },
    variableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    variableKeyInput: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        ...Typography.default(),
        fontSize: 13,
    },
    variableValueInput: {
        flex: 2,
        padding: 10,
        borderRadius: 6,
        ...Typography.default(),
        fontSize: 13,
    },
    addVariableButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    addVariableText: {
        ...Typography.default(),
        fontSize: 13,
    },
}));

export default function EnvironmentPickerScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const params = useLocalSearchParams<{
        selectedEnvSetIdsJson?: string;
        customEnvVarsJson?: string;
    }>();
    const inputRef = useRef<MultiTextInputHandle>(null);
    const environmentSets = useSetting('environmentSets');

    const [searchQuery, setSearchQuery] = useState('');
    // Multi-select: array of selected set IDs
    const [selectedSetIds, setSelectedSetIds] = useState<string[]>(() => {
        if (params.selectedEnvSetIdsJson) {
            try {
                const parsed = JSON.parse(params.selectedEnvSetIdsJson);
                if (Array.isArray(parsed)) {
                    // Filter out any IDs that no longer exist
                    const existingIds = new Set(environmentSets.map(s => s.id));
                    return parsed.filter((id): id is string => typeof id === 'string' && existingIds.has(id));
                }
            } catch {
                // Fall through to empty array
            }
        }
        return [];
    });
    const [customVars, setCustomVars] = useState<Array<{ key: string; value: string }>>(() => {
        if (params.customEnvVarsJson) {
            try {
                const parsed = JSON.parse(params.customEnvVarsJson);
                return Object.entries(parsed).map(([key, value]) => ({ key, value: value as string }));
            } catch {
                return [];
            }
        }
        return [];
    });
    const [showCustomVars, setShowCustomVars] = useState(customVars.length > 0);

    // Auto-focus the search input
    useFocusEffect(
        React.useCallback(() => {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }, [])
    );

    // Filter environment sets based on search
    const filteredSets = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return environmentSets;
        return environmentSets.filter(set =>
            set.name.toLowerCase().includes(query) ||
            Object.keys(set.variables).some(key => key.toLowerCase().includes(query))
        );
    }, [environmentSets, searchQuery]);

    // Format variables for display
    const formatVariables = (variables: Record<string, string>): string => {
        const keys = Object.keys(variables);
        if (keys.length === 0) return t('settingsEnvironments.noVariables');
        if (keys.length <= 3) return keys.join(', ');
        return `${keys.slice(0, 3).join(', ')} +${keys.length - 3}`;
    };

    // Toggle selection of an environment set (multi-select)
    const handleToggleSet = useCallback((setId: string) => {
        setSelectedSetIds(prev => {
            if (prev.includes(setId)) {
                // Remove from selection
                return prev.filter(id => id !== setId);
            } else {
                // Add to selection (at the end)
                return [...prev, setId];
            }
        });
    }, []);

    const handleAddCustomVar = useCallback(() => {
        setShowCustomVars(true);
        setCustomVars([...customVars, { key: '', value: '' }]);
    }, [customVars]);

    const handleRemoveCustomVar = useCallback((index: number) => {
        const newVars = customVars.filter((_, i) => i !== index);
        setCustomVars(newVars);
        if (newVars.length === 0) {
            setShowCustomVars(false);
        }
    }, [customVars]);

    const handleCustomVarChange = useCallback((index: number, field: 'key' | 'value', value: string) => {
        const newVars = [...customVars];
        newVars[index][field] = value;
        setCustomVars(newVars);
    }, [customVars]);

    // Merge a preset's variables into custom vars (overwrites existing keys)
    const handleMergePreset = useCallback((envSet: EnvironmentSet) => {
        const presetVars = Object.entries(envSet.variables);
        if (presetVars.length === 0) return;

        // Build a map of existing custom vars by key
        const existingByKey = new Map<string, number>();
        customVars.forEach((v, i) => {
            if (v.key.trim()) {
                existingByKey.set(v.key.trim(), i);
            }
        });

        // Start with current custom vars
        const newVars = [...customVars];

        // Merge preset vars, overwriting existing keys
        presetVars.forEach(([key, value]) => {
            const existingIndex = existingByKey.get(key);
            if (existingIndex !== undefined) {
                // Overwrite existing
                newVars[existingIndex] = { key, value };
            } else {
                // Add new
                newVars.push({ key, value });
            }
        });

        // Remove empty entries that might exist
        const cleanedVars = newVars.filter(v => v.key.trim() || v.value.trim());

        setCustomVars(cleanedVars.length > 0 ? cleanedVars : [{ key: '', value: '' }]);
        setShowCustomVars(true);
    }, [customVars]);

    const handleConfirm = useCallback(() => {
        // Convert custom vars to object
        const customVarsObj: Record<string, string> = {};
        customVars.forEach(({ key, value }) => {
            if (key.trim()) {
                customVarsObj[key.trim()] = value;
            }
        });

        router.dismissTo({
            pathname: '/new',
            params: {
                selectedEnvSetIdsJson: JSON.stringify(selectedSetIds),
                customEnvVarsJson: Object.keys(customVarsObj).length > 0 ? JSON.stringify(customVarsObj) : '',
            }
        });
    }, [selectedSetIds, customVars, router]);

    // Handle keyboard events
    const handleKeyPress = useCallback((event: { key: string; shiftKey: boolean }) => {
        if (event.key === 'Enter') {
            handleConfirm();
            return true;
        }

        // Tab - Toggle first filtered result
        if (event.key === 'Tab' && !event.shiftKey) {
            if (filteredSets.length > 0) {
                handleToggleSet(filteredSets[0].id);
                setSearchQuery('');
                return true; // Handled - prevent default tab behavior
            }
        }

        return false;
    }, [handleConfirm, filteredSets, handleToggleSet]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('environmentPicker.title'),
                    headerBackTitle: t('common.back'),
                    headerRight: () => (
                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                padding: 4,
                            })}
                        >
                            <Ionicons
                                name="checkmark"
                                size={24}
                                color={theme.colors.header.tint}
                            />
                        </Pressable>
                    )
                }}
            />
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentWrapper}>
                        {/* Search */}
                        <ItemGroup title={t('environmentPicker.search')}>
                            <View style={styles.searchContainer}>
                                <View style={[styles.searchInput, { paddingVertical: 8 }]}>
                                    <View style={styles.searchInputInner}>
                                        <View style={styles.searchInputText}>
                                            <MultiTextInput
                                                ref={inputRef}
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                placeholder={t('environmentPicker.searchPlaceholder')}
                                                maxHeight={36}
                                                paddingTop={8}
                                                paddingBottom={8}
                                                onKeyPress={handleKeyPress}
                                            />
                                        </View>
                                        {searchQuery.length > 0 && (
                                            <Pressable
                                                onPress={() => {
                                                    setSearchQuery('');
                                                    inputRef.current?.focus();
                                                }}
                                                style={styles.clearButton}
                                                hitSlop={8}
                                            >
                                                <Ionicons
                                                    name="close-circle"
                                                    size={18}
                                                    color={theme.colors.textSecondary}
                                                />
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </ItemGroup>

                        {/* Environment Sets - Multi-select with checkboxes */}
                        <ItemGroup title={t('environmentPicker.savedSets')}>
                            {filteredSets.map((envSet, index) => {
                                const isSelected = selectedSetIds.includes(envSet.id);
                                const isLast = index === filteredSets.length - 1;

                                return (
                                    <Item
                                        key={envSet.id}
                                        title={envSet.name}
                                        subtitle={formatVariables(envSet.variables)}
                                        leftElement={
                                            <Ionicons
                                                name={isSelected ? "checkbox" : "square-outline"}
                                                size={20}
                                                color={isSelected ? theme.colors.textLink : theme.colors.textSecondary}
                                            />
                                        }
                                        rightElement={
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                {envSet.applyByDefault && (
                                                    <Ionicons
                                                        name="star"
                                                        size={16}
                                                        color="#FFD700"
                                                    />
                                                )}
                                                <Pressable
                                                    onPress={() => handleMergePreset(envSet)}
                                                    hitSlop={8}
                                                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                                >
                                                    <Ionicons
                                                        name="copy-outline"
                                                        size={18}
                                                        color={theme.colors.textSecondary}
                                                    />
                                                </Pressable>
                                            </View>
                                        }
                                        onPress={() => handleToggleSet(envSet.id)}
                                        selected={isSelected}
                                        showChevron={false}
                                        pressableStyle={isSelected ? { backgroundColor: theme.colors.surfaceSelected } : undefined}
                                        showDivider={!isLast}
                                    />
                                );
                            })}

                            {environmentSets.length === 0 && (
                                <View style={{ padding: 16, alignItems: 'center' }}>
                                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                        {t('environmentPicker.noSets')}
                                    </Text>
                                </View>
                            )}
                        </ItemGroup>

                        {/* Custom Variables for this session */}
                        <ItemGroup title={t('environmentPicker.customForSession')}>
                            {showCustomVars ? (
                                <View style={[styles.customVarsContainer, { backgroundColor: theme.colors.surface }]}>
                                    {customVars.map((variable, index) => (
                                        <View key={index} style={styles.variableRow}>
                                            <TextInput
                                                style={[styles.variableKeyInput, {
                                                    color: theme.colors.input.text,
                                                    backgroundColor: theme.colors.input.background
                                                }]}
                                                value={variable.key}
                                                onChangeText={(value) => handleCustomVarChange(index, 'key', value)}
                                                placeholder="KEY"
                                                placeholderTextColor={theme.colors.input.placeholder}
                                                autoCapitalize="characters"
                                                autoCorrect={false}
                                            />
                                            <TextInput
                                                style={[styles.variableValueInput, {
                                                    color: theme.colors.input.text,
                                                    backgroundColor: theme.colors.input.background
                                                }]}
                                                value={variable.value}
                                                onChangeText={(value) => handleCustomVarChange(index, 'value', value)}
                                                placeholder="value"
                                                placeholderTextColor={theme.colors.input.placeholder}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                secureTextEntry={
                                                    variable.key.toLowerCase().includes('key') ||
                                                    variable.key.toLowerCase().includes('token') ||
                                                    variable.key.toLowerCase().includes('secret')
                                                }
                                            />
                                            <Pressable onPress={() => handleRemoveCustomVar(index)} hitSlop={8}>
                                                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                                            </Pressable>
                                        </View>
                                    ))}
                                    <Pressable onPress={handleAddCustomVar} style={styles.addVariableButton}>
                                        <Ionicons name="add" size={18} color={theme.colors.textLink} />
                                        <Text style={[styles.addVariableText, { color: theme.colors.textLink }]}>
                                            {t('settingsEnvironments.addVariable')}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Item
                                    title={t('environmentPicker.addCustomVariable')}
                                    icon={<Ionicons name="add-circle-outline" size={24} color={theme.colors.textLink} />}
                                    onPress={handleAddCustomVar}
                                    showChevron={false}
                                />
                            )}
                        </ItemGroup>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
