import React from 'react';
import { View, TextInput, Platform } from 'react-native';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { useUnistyles } from 'react-native-unistyles';

interface CommandPaletteInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onKeyPress?: (key: string) => void;
    inputRef?: React.RefObject<TextInput | null>;
}

export function CommandPaletteInput({ value, onChangeText, onKeyPress, inputRef }: CommandPaletteInputProps) {
    const { theme } = useUnistyles();
    const terminalUI = theme.colors.terminalUI;
    const isTerminal = terminalUI.useMonospace;

    const handleKeyDown = React.useCallback((e: any) => {
        if (Platform.OS === 'web' && onKeyPress) {
            const key = e.nativeEvent.key;

            // Handle navigation keys
            if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
                onKeyPress(key);
            }
        }
    }, [onKeyPress]);

    const isDark = theme.dark;

    return (
        <View style={{
            borderBottomWidth: 1,
            borderBottomColor: isTerminal ? terminalUI.borderColor : theme.colors.divider,
            backgroundColor: isTerminal ? theme.colors.surface : (isDark ? theme.colors.surfaceHigh : '#FAFAFA'),
        }}>
            <TextInput
                ref={inputRef}
                style={[
                    {
                        paddingHorizontal: 32,
                        paddingVertical: 24,
                        fontSize: isTerminal ? 18 : 20,
                        color: theme.colors.text,
                        letterSpacing: isTerminal ? 0.5 : -0.3,
                        ...(Platform.OS === 'web' ? {
                            outlineStyle: 'none',
                            outlineWidth: 0,
                        } as any : {}),
                        ...(terminalUI.textGlow.enabled ? {
                            textShadowColor: terminalUI.textGlow.color,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: terminalUI.textGlow.radius,
                        } : {}),
                    },
                    isTerminal ? Typography.mono() : Typography.default()
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={t('commandPalette.placeholder')}
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                returnKeyType="go"
                onKeyPress={handleKeyDown}
                blurOnSubmit={false}
            />
        </View>
    );
}
