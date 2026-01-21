import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Text, Platform } from 'react-native';
import { Command, CommandCategory } from './types';
import { CommandPaletteItem } from './CommandPaletteItem';
import { Typography } from '@/constants/Typography';
import { useUnistyles } from 'react-native-unistyles';

interface CommandPaletteResultsProps {
    categories: CommandCategory[];
    selectedIndex: number;
    onSelectCommand: (command: Command) => void;
    onSelectionChange: (index: number) => void;
}

export function CommandPaletteResults({
    categories,
    selectedIndex,
    onSelectCommand,
    onSelectionChange
}: CommandPaletteResultsProps) {
    const { theme } = useUnistyles();
    const terminalUI = theme.colors.terminalUI;
    const isTerminal = terminalUI.useMonospace;

    const scrollViewRef = useRef<ScrollView>(null);
    const itemRefs = useRef<{ [key: number]: View | null }>({});

    // Flatten commands for index tracking
    const allCommands = React.useMemo(() => {
        return categories.flatMap(cat => cat.commands);
    }, [categories]);

    // Scroll to selected item when index changes
    useEffect(() => {
        const selectedItem = itemRefs.current[selectedIndex];
        if (selectedItem && scrollViewRef.current) {
            // For web, we need to use the DOM API
            if (typeof (selectedItem as any).scrollIntoView === 'function') {
                (selectedItem as any).scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [selectedIndex]);

    if (categories.length === 0 || allCommands.length === 0) {
        return (
            <View style={{
                padding: 48,
                alignItems: 'center',
            }}>
                <Text style={[
                    {
                        fontSize: isTerminal ? 14 : 15,
                        color: theme.colors.textSecondary,
                        letterSpacing: isTerminal ? 0.5 : -0.2,
                        ...(terminalUI.textGlow.enabled ? {
                            textShadowColor: terminalUI.textGlow.color,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: terminalUI.textGlow.radius / 2,
                        } : {}),
                    },
                    isTerminal ? Typography.mono() : Typography.default()
                ]}>
                    {isTerminal ? '> NO COMMANDS FOUND' : 'No commands found'}
                </Text>
            </View>
        );
    }

    let currentIndex = 0;

    return (
        <ScrollView
            ref={scrollViewRef}
            style={{
                ...(Platform.OS === 'web' ? {
                    maxHeight: '40vh',
                } as any : {
                    maxHeight: 420,
                }),
                paddingVertical: 8,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {categories.map(category => {
                if (category.commands.length === 0) return null;

                const categoryStartIndex = currentIndex;
                const categoryCommands = category.commands.map((command, idx) => {
                    const commandIndex = categoryStartIndex + idx;
                    const isSelected = commandIndex === selectedIndex;
                    currentIndex++;

                    return (
                        <View
                            key={command.id}
                            ref={(ref) => {
                                itemRefs.current[commandIndex] = ref;
                            }}
                        >
                            <CommandPaletteItem
                                command={command}
                                isSelected={isSelected}
                                onPress={() => onSelectCommand(command)}
                                onHover={() => onSelectionChange(commandIndex)}
                            />
                        </View>
                    );
                });

                return (
                    <View key={category.id}>
                        <Text style={[
                            {
                                paddingHorizontal: 32,
                                paddingTop: 16,
                                paddingBottom: 8,
                                fontSize: isTerminal ? 11 : 12,
                                color: theme.colors.textSecondary,
                                textTransform: 'uppercase',
                                letterSpacing: isTerminal ? 1.5 : 0.8,
                                fontWeight: '600',
                                ...(terminalUI.textGlow.enabled ? {
                                    textShadowColor: terminalUI.textGlow.color,
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: terminalUI.textGlow.radius / 2,
                                } : {}),
                            },
                            isTerminal ? Typography.mono('semiBold') : Typography.default('semiBold')
                        ]}>
                            {isTerminal ? `// ${category.title}` : category.title}
                        </Text>
                        {categoryCommands}
                    </View>
                );
            })}
        </ScrollView>
    );
}
