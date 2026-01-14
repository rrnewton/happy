import React, { useState, useCallback, memo } from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Text } from '@/components/StyledText';
import { useSettingMutable } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import { layout } from '@/components/layout';

function AISettingsScreen() {
    const { theme } = useUnistyles();
    const [savedPrompt, setSavedPrompt] = useSettingMutable('customSystemPrompt');

    // Local state for input field (buffered to avoid per-keystroke syncs)
    const [promptInput, setPromptInput] = useState(savedPrompt || '');

    // Save prompt when user leaves the field
    const handlePromptBlur = useCallback(() => {
        const trimmed = promptInput.trim();
        if (trimmed !== (savedPrompt || '')) {
            setSavedPrompt(trimmed || null);
        }
    }, [promptInput, savedPrompt, setSavedPrompt]);

    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Custom System Prompt */}
            <ItemGroup
                title={t('settingsAI.systemPromptTitle')}
                footer={t('settingsAI.systemPromptDescription')}
            >
                <View style={styles.contentContainer}>
                    <View style={styles.labelRow}>
                        <Text style={styles.labelText}>{t('settingsAI.systemPromptLabel').toUpperCase()}</Text>
                    </View>
                    <TextInput
                        style={[styles.textArea, { color: theme.colors.input.text, backgroundColor: theme.colors.input.background }]}
                        value={promptInput}
                        onChangeText={setPromptInput}
                        onBlur={handlePromptBlur}
                        placeholder={t('settingsAI.systemPromptPlaceholder')}
                        placeholderTextColor={theme.colors.input.placeholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                    <Text style={styles.hintText}>{t('settingsAI.systemPromptHint')}</Text>
                </View>
            </ItemGroup>
        </ItemList>
    );
}

export default memo(AISettingsScreen);

const styles = StyleSheet.create((theme) => ({
    contentContainer: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    labelText: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textArea: {
        padding: 12,
        borderRadius: 8,
        ...Typography.default(),
        fontSize: 14,
        minHeight: 150,
    },
    hintText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 12,
        lineHeight: 16,
    },
}));
