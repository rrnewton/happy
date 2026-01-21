import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Command } from './types';
import { Typography } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';

interface CommandPaletteItemProps {
    command: Command;
    isSelected: boolean;
    onPress: () => void;
    onHover?: () => void;
}

export function CommandPaletteItem({ command, isSelected, onPress, onHover }: CommandPaletteItemProps) {
    const { theme } = useUnistyles();
    const terminalUI = theme.colors.terminalUI;
    const isTerminal = terminalUI.useMonospace;

    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseEnter = React.useCallback(() => {
        if (Platform.OS === 'web') {
            setIsHovered(true);
            onHover?.();
        }
    }, [onHover]);

    const handleMouseLeave = React.useCallback(() => {
        if (Platform.OS === 'web') {
            setIsHovered(false);
        }
    }, []);

    // Terminal theme colors
    const selectedBg = isTerminal
        ? `${terminalUI.borderColor}20` // 20 = ~12% opacity
        : '#F0F7FF';
    const selectedBorder = isTerminal
        ? `${terminalUI.borderColor}40`
        : '#007AFF20';
    const hoveredBg = isTerminal
        ? `${terminalUI.borderColor}10`
        : '#F8F8F8';
    const pressedBg = isTerminal
        ? `${terminalUI.borderColor}30`
        : '#F5F5F5';
    const iconColor = isSelected
        ? (isTerminal ? theme.colors.text : '#007AFF')
        : theme.colors.textSecondary;
    const iconBg = isTerminal
        ? `${terminalUI.borderColor}15`
        : 'rgba(0, 0, 0, 0.04)';

    const pressableProps: any = {
        style: ({ pressed }: any) => [
            {
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: 'transparent',
                marginHorizontal: 8,
                marginVertical: 2,
                borderRadius: isTerminal ? 4 : 8,
                borderWidth: isTerminal ? 1 : 2,
                borderColor: 'transparent',
            },
            isSelected && {
                backgroundColor: selectedBg,
                borderColor: selectedBorder,
            },
            isHovered && !isSelected && {
                backgroundColor: hoveredBg,
            },
            pressed && Platform.OS === 'web' && {
                backgroundColor: pressedBg,
            }
        ],
        onPress,
    };

    // Add mouse events only on web
    if (Platform.OS === 'web') {
        pressableProps.onMouseEnter = handleMouseEnter;
        pressableProps.onMouseLeave = handleMouseLeave;
    }

    return (
        <Pressable {...pressableProps}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {command.icon && (
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: isTerminal ? 4 : 8,
                        backgroundColor: iconBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        <Ionicons
                            name={command.icon as any}
                            size={20}
                            color={iconColor}
                        />
                    </View>
                )}
                <View style={{
                    flex: 1,
                    marginRight: 12,
                }}>
                    <Text
                        numberOfLines={1}
                        style={[
                            {
                                fontSize: isTerminal ? 14 : 15,
                                color: theme.colors.text,
                                marginBottom: 2,
                                letterSpacing: isTerminal ? 0.3 : -0.2,
                                ...(terminalUI.textGlow.enabled ? {
                                    textShadowColor: terminalUI.textGlow.color,
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: terminalUI.textGlow.radius,
                                } : {}),
                            },
                            isTerminal ? Typography.mono() : Typography.default()
                        ]}
                    >
                        {isTerminal && isSelected ? `> ${command.title}` : command.title}
                    </Text>
                    {command.subtitle && (
                        <Text
                            numberOfLines={1}
                            style={[
                                {
                                    fontSize: isTerminal ? 12 : 13,
                                    color: theme.colors.textSecondary,
                                    letterSpacing: isTerminal ? 0.2 : -0.1,
                                    ...(terminalUI.textGlow.enabled ? {
                                        textShadowColor: terminalUI.textGlow.color,
                                        textShadowOffset: { width: 0, height: 0 },
                                        textShadowRadius: terminalUI.textGlow.radius / 2,
                                    } : {}),
                                },
                                isTerminal ? Typography.mono() : Typography.default()
                            ]}
                        >
                            {command.subtitle}
                        </Text>
                    )}
                </View>
                {command.shortcut && (
                    <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        backgroundColor: iconBg,
                        borderRadius: isTerminal ? 4 : 6,
                        ...(isTerminal && terminalUI.useBorders ? {
                            borderWidth: 1,
                            borderColor: `${terminalUI.borderColor}40`,
                        } : {}),
                    }}>
                        <Text style={[
                            {
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                                fontWeight: '500',
                                letterSpacing: isTerminal ? 0.5 : 0,
                                ...(terminalUI.textGlow.enabled ? {
                                    textShadowColor: terminalUI.textGlow.color,
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: terminalUI.textGlow.radius / 2,
                                } : {}),
                            },
                            Typography.mono()
                        ]}>
                            {command.shortcut}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}
