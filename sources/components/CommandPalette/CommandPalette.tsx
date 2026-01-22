import React from 'react';
import { View, Platform } from 'react-native';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteResults } from './CommandPaletteResults';
import { useCommandPalette } from './useCommandPalette';
import { Command } from './types';
import { useUnistyles } from 'react-native-unistyles';

interface CommandPaletteProps {
    commands: Command[];
    onClose: () => void;
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
    const { theme } = useUnistyles();
    const {
        searchQuery,
        selectedIndex,
        filteredCategories,
        inputRef,
        handleSearchChange,
        handleSelectCommand,
        handleKeyPress,
        setSelectedIndex,
    } = useCommandPalette(commands, onClose);

    // Only render on web
    if (Platform.OS !== 'web') {
        return null;
    }

    const terminalUI = theme.colors.terminalUI;
    const isTerminal = terminalUI.useMonospace;

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: terminalUI.borderRadius,
            width: '100%',
            maxWidth: 800,
            maxHeight: '60vh' as any,
            overflow: 'hidden',
            ...(terminalUI.useBorders ? {
                borderWidth: terminalUI.borderWidth,
                borderColor: terminalUI.borderColor,
            } : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.25,
                shadowRadius: 40,
                elevation: 20,
                borderWidth: 1,
                borderColor: theme.colors.modal.border,
            }),
        }}>
            <CommandPaletteInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                onKeyPress={handleKeyPress}
                inputRef={inputRef}
            />
            <CommandPaletteResults
                categories={filteredCategories}
                selectedIndex={selectedIndex}
                onSelectCommand={handleSelectCommand}
                onSelectionChange={setSelectedIndex}
            />
        </View>
    );
}