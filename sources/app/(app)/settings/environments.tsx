import React, { useState, useCallback, memo } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Item } from '@/components/Item';
import { Text } from '@/components/StyledText';
import { useSettingMutable } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import { layout } from '@/components/layout';
import { Modal } from '@/modal';
import type { EnvironmentSet } from '@/sync/settings';

// Generate a simple UUID-like ID
function generateId(): string {
    return 'env_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// Modal for editing an environment set
function EditEnvironmentSetModal({
    envSet,
    onSave,
    onDelete,
    onClose
}: {
    envSet: EnvironmentSet | null;
    onSave: (envSet: EnvironmentSet) => void;
    onDelete?: () => void;
    onClose: () => void;
}) {
    const { theme } = useUnistyles();
    const isNew = envSet === null;

    const [name, setName] = useState(envSet?.name || '');
    const [variables, setVariables] = useState<Array<{ key: string; value: string }>>(
        envSet ? Object.entries(envSet.variables).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]
    );

    const handleAddVariable = () => {
        setVariables([...variables, { key: '', value: '' }]);
    };

    const handleRemoveVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const handleVariableChange = (index: number, field: 'key' | 'value', value: string) => {
        const newVariables = [...variables];
        newVariables[index][field] = value;
        setVariables(newVariables);
    };

    const handleSave = () => {
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

        onSave({
            id: envSet?.id || generateId(),
            name: name.trim(),
            variables: variablesObj,
            applyByDefault: envSet?.applyByDefault,
        });
        onClose();
    };

    return (
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {isNew ? t('settingsEnvironments.addNew') : t('settingsEnvironments.edit')}
            </Text>

            <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                    {t('settingsEnvironments.name').toUpperCase()}
                </Text>
                <TextInput
                    style={[styles.textInput, {
                        color: theme.colors.input.text,
                        backgroundColor: theme.colors.input.background
                    }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('settingsEnvironments.namePlaceholder')}
                    placeholderTextColor={theme.colors.input.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                    {t('settingsEnvironments.variables').toUpperCase()}
                </Text>

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
                            secureTextEntry={variable.key.toLowerCase().includes('key') || variable.key.toLowerCase().includes('token') || variable.key.toLowerCase().includes('secret')}
                        />
                        <Pressable onPress={() => handleRemoveVariable(index)} hitSlop={8}>
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

            <View style={styles.modalButtons}>
                {/* Delete button on the left (only for existing sets) */}
                {!isNew && onDelete ? (
                    <Pressable onPress={onDelete} style={styles.modalButton}>
                        <Text style={[styles.modalButtonText, { color: theme.colors.textDestructive }]}>
                            {t('common.delete')}
                        </Text>
                    </Pressable>
                ) : (
                    <View style={{ flex: 1 }} />
                )}

                <View style={styles.modalButtonsRight}>
                    <Pressable onPress={onClose} style={styles.modalButton}>
                        <Text style={[styles.modalButtonText, { color: theme.colors.textLink }]}>
                            {t('common.cancel')}
                        </Text>
                    </Pressable>
                    <Pressable onPress={handleSave} style={styles.modalButton}>
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimary, { color: theme.colors.textLink }]}>
                            {t('common.save')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

function EnvironmentsSettingsScreen() {
    const { theme } = useUnistyles();
    const [environmentSets, setEnvironmentSets] = useSettingMutable('environmentSets');

    const handleAddNew = useCallback(() => {
        Modal.show({
            component: EditEnvironmentSetModal,
            props: {
                envSet: null,
                onSave: (newEnvSet: EnvironmentSet) => {
                    setEnvironmentSets([...environmentSets, newEnvSet]);
                },
            }
        });
    }, [environmentSets, setEnvironmentSets]);

    const handleEdit = useCallback((envSet: EnvironmentSet) => {
        const modalId = Modal.show({
            component: EditEnvironmentSetModal,
            props: {
                envSet,
                onSave: (updatedEnvSet: EnvironmentSet) => {
                    setEnvironmentSets(environmentSets.map(e =>
                        e.id === updatedEnvSet.id ? updatedEnvSet : e
                    ));
                },
                onDelete: async () => {
                    const confirmed = await Modal.confirm(
                        t('settingsEnvironments.deleteTitle'),
                        t('settingsEnvironments.deleteConfirm', { name: envSet.name }),
                        { confirmText: t('common.delete'), destructive: true }
                    );

                    if (confirmed) {
                        setEnvironmentSets(environmentSets.filter(e => e.id !== envSet.id));
                        Modal.hide(modalId);
                    }
                },
            }
        });
    }, [environmentSets, setEnvironmentSets]);

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
    modalContainer: {
        padding: 20,
        borderRadius: 12,
        minWidth: 320,
        maxWidth: 400,
    },
    modalTitle: {
        ...Typography.default('semiBold'),
        fontSize: 18,
        marginBottom: 20,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    fieldLabel: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    textInput: {
        padding: 12,
        borderRadius: 8,
        ...Typography.default(),
        fontSize: 14,
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
        alignSelf: 'flex-start',
    },
    addVariableText: {
        ...Typography.default(),
        fontSize: 13,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    modalButtonsRight: {
        flexDirection: 'row',
        gap: 16,
    },
    modalButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    modalButtonText: {
        ...Typography.default(),
        fontSize: 16,
    },
    modalButtonPrimary: {
        fontWeight: '600',
    },
}));
