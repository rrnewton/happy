import React, { useState, useCallback, useLayoutEffect, memo } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Item } from '@/components/Item';
import { Text } from '@/components/StyledText';
import { Switch } from '@/components/Switch';
import { useSettingMutable } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import { Modal } from '@/modal';
import type { EnvironmentSet } from '@/sync/settings';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useHappyAction } from '@/hooks/useHappyAction';

// Generate a simple UUID-like ID
function generateId(): string {
    return 'env_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

function EnvironmentEditScreen() {
    const { theme } = useUnistyles();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const [environmentSets, setEnvironmentSets] = useSettingMutable('environmentSets');

    const isNew = id === 'new';
    const existingEnvSet = isNew ? null : environmentSets.find(e => e.id === id);

    const [name, setName] = useState(existingEnvSet?.name || '');
    const [applyByDefault, setApplyByDefault] = useState(existingEnvSet?.applyByDefault || false);
    const [variables, setVariables] = useState<Array<{ key: string; value: string }>>(
        existingEnvSet ? Object.entries(existingEnvSet.variables).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]
    );

    // Set header title
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: isNew ? t('settingsEnvironments.addNew') : t('settingsEnvironments.edit'),
        });
    }, [navigation, isNew]);

    const handleAddVariable = useCallback(() => {
        setVariables([...variables, { key: '', value: '' }]);
    }, [variables]);

    const handleRemoveVariable = useCallback((index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    }, [variables]);

    const handleVariableChange = useCallback((index: number, field: 'key' | 'value', value: string) => {
        const newVariables = [...variables];
        newVariables[index][field] = value;
        setVariables(newVariables);
    }, [variables]);

    const [isSaving, handleSave] = useHappyAction(async () => {
        if (!name.trim()) {
            Modal.alert(t('common.error'), t('settingsEnvironments.nameRequired'));
            return;
        }

        // Filter out empty variables and convert to object
        const variablesObj: Record<string, string> = {};
        variables.forEach(({ key, value }) => {
            if (key.trim()) {
                variablesObj[key.trim()] = value;
            }
        });

        const newEnvSet: EnvironmentSet = {
            id: existingEnvSet?.id || generateId(),
            name: name.trim(),
            variables: variablesObj,
            applyByDefault,
        };

        if (isNew) {
            setEnvironmentSets([...environmentSets, newEnvSet]);
        } else {
            setEnvironmentSets(environmentSets.map(e =>
                e.id === newEnvSet.id ? newEnvSet : e
            ));
        }

        router.back();
    });

    const [isDeleting, handleDelete] = useHappyAction(async () => {
        if (!existingEnvSet) return;

        const confirmed = await Modal.confirm(
            t('settingsEnvironments.deleteTitle'),
            t('settingsEnvironments.deleteConfirm', { name: existingEnvSet.name }),
            { confirmText: t('common.delete'), destructive: true }
        );

        if (confirmed) {
            setEnvironmentSets(environmentSets.filter(e => e.id !== existingEnvSet.id));
            router.back();
        }
    });

    const [isDuplicating, handleDuplicate] = useHappyAction(async () => {
        if (!existingEnvSet) return;

        // Create a duplicate with a new ID and " - Copy" suffix
        const duplicatedEnvSet: EnvironmentSet = {
            id: generateId(),
            name: `${existingEnvSet.name} - Copy`,
            variables: { ...existingEnvSet.variables },
            applyByDefault: false, // Don't copy the default flag
        };
        setEnvironmentSets([...environmentSets, duplicatedEnvSet]);
        router.back();
    });

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ItemList
                style={{ paddingTop: 0 }}
                keyboardShouldPersistTaps="handled"
            >
                <ItemGroup
                    title={t('settingsEnvironments.name').toUpperCase()}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.textInput, {
                                color: theme.colors.input.text,
                            }]}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('settingsEnvironments.namePlaceholder')}
                            placeholderTextColor={theme.colors.input.placeholder}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </ItemGroup>

                <ItemGroup
                    title={t('settingsEnvironments.variables').toUpperCase()}
                >
                    <View style={styles.variablesContainer}>
                        {variables.map((variable, index) => (
                            <View key={index} style={styles.variableRow}>
                                <TextInput
                                    style={[styles.variableKeyInput, {
                                        color: theme.colors.input.text,
                                        backgroundColor: theme.colors.input.background
                                    }]}
                                    value={variable.key}
                                    onChangeText={(value) => handleVariableChange(index, 'key', value)}
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
                                    onChangeText={(value) => handleVariableChange(index, 'value', value)}
                                    placeholder="value"
                                    placeholderTextColor={theme.colors.input.placeholder}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    secureTextEntry={variable.key.toLowerCase().includes('key') ||
                                                   variable.key.toLowerCase().includes('token') ||
                                                   variable.key.toLowerCase().includes('secret')}
                                />
                                <Pressable
                                    onPress={() => handleRemoveVariable(index)}
                                    hitSlop={8}
                                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                >
                                    <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable
                            onPress={handleAddVariable}
                            style={[styles.addVariableButton, { borderColor: theme.colors.divider }]}
                        >
                            <Ionicons name="add" size={18} color={theme.colors.textLink} />
                            <Text style={[styles.addVariableText, { color: theme.colors.textLink }]}>
                                {t('settingsEnvironments.addVariable')}
                            </Text>
                        </Pressable>
                    </View>
                </ItemGroup>

                <ItemGroup>
                    <Item
                        title={t('settingsEnvironments.applyByDefault')}
                        subtitle={t('settingsEnvironments.applyByDefaultDescription')}
                        icon={<Ionicons name="star-outline" size={29} color="#FFD700" />}
                        rightElement={
                            <Switch
                                value={applyByDefault}
                                onValueChange={setApplyByDefault}
                            />
                        }
                    />
                </ItemGroup>

                <ItemGroup>
                    <Item
                        title={t('common.save')}
                        onPress={handleSave}
                        icon={<Ionicons name="checkmark-circle-outline" size={29} color={theme.colors.textLink} />}
                        showChevron={false}
                        loading={isSaving}
                    />
                    {!isNew && (
                        <Item
                            title={t('settingsEnvironments.duplicate')}
                            onPress={handleDuplicate}
                            icon={<Ionicons name="copy-outline" size={29} color={theme.colors.textSecondary} />}
                            showChevron={false}
                            loading={isDuplicating}
                            showDivider
                        />
                    )}
                </ItemGroup>

                {!isNew && (
                    <ItemGroup>
                        <Item
                            title={t('common.delete')}
                            onPress={handleDelete}
                            icon={<Ionicons name="trash-outline" size={29} color={theme.colors.textDestructive} />}
                            titleStyle={{ color: theme.colors.textDestructive }}
                            showChevron={false}
                            loading={isDeleting}
                        />
                    </ItemGroup>
                )}

                <ItemGroup footer={t('settingsEnvironments.tipText')}>
                    <View style={styles.helpContainer}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                            {t('settingsEnvironments.helpText')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        </KeyboardAvoidingView>
    );
}

export default memo(EnvironmentEditScreen);

const styles = StyleSheet.create((theme) => ({
    inputContainer: {
        padding: 16,
    },
    textInput: {
        ...Typography.default(),
        fontSize: 16,
    },
    variablesContainer: {
        padding: 16,
    },
    variableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    variableKeyInput: {
        flex: 1,
        minWidth: 0,
        padding: 10,
        borderRadius: 6,
        ...Typography.default(),
        fontSize: 14,
    },
    variableValueInput: {
        flex: 2,
        minWidth: 0,
        padding: 10,
        borderRadius: 6,
        ...Typography.default(),
        fontSize: 14,
    },
    addVariableButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    addVariableText: {
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