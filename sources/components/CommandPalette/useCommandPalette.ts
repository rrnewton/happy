import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TextInput } from 'react-native';
import { Command, CommandCategory } from './types';

export function useCommandPalette(commands: Command[], onClose: () => void) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<TextInput>(null);

    // Filter commands based on search query
    const filteredCategories = useMemo((): CommandCategory[] => {
        if (!searchQuery.trim()) {
            // Group commands by category
            const grouped = commands.reduce((acc, command) => {
                const category = command.category || 'General';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(command);
                return acc;
            }, {} as Record<string, Command[]>);

            // Limit "Active Sessions" to 3 items when not searching
            // This prevents the command palette from being cluttered
            if (grouped['Active Sessions'] && grouped['Active Sessions'].length > 3) {
                grouped['Active Sessions'] = grouped['Active Sessions'].slice(0, 3);
            }

            // Define category order - Active Sessions first, then the rest
            const categoryOrder = ['Active Sessions', 'Sessions', 'Navigation', 'Current Session', 'System', 'Developer', 'General'];
            const sortedEntries = categoryOrder
                .filter(cat => grouped[cat])
                .map(cat => [cat, grouped[cat]] as [string, Command[]]);

            // Add any categories not in the predefined order at the end
            const remainingCategories = Object.entries(grouped)
                .filter(([cat]) => !categoryOrder.includes(cat));

            return [...sortedEntries, ...remainingCategories].map(([title, cmds]) => ({
                id: title.toLowerCase().replace(/\s+/g, '-'),
                title,
                commands: cmds
            }));
        }

        // Fuzzy search - prioritize title matches, then include subtitle and searchMeta
        const query = searchQuery.toLowerCase();
        const filtered = commands.filter(command => {
            const titleMatch = command.title.toLowerCase().includes(query);
            const subtitleMatch = command.subtitle?.toLowerCase().includes(query);
            const metaMatch = command.searchMeta?.includes(query);
            return titleMatch || subtitleMatch || metaMatch;
        });

        // Sort results: title matches first, then subtitle/meta matches
        filtered.sort((a, b) => {
            const aTitle = a.title.toLowerCase().includes(query);
            const bTitle = b.title.toLowerCase().includes(query);
            if (aTitle && !bTitle) return -1;
            if (!aTitle && bTitle) return 1;
            return 0;
        });

        if (filtered.length === 0) {
            return [];
        }

        // Group filtered results
        const grouped = filtered.reduce((acc, command) => {
            const category = command.category || 'Results';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(command);
            return acc;
        }, {} as Record<string, Command[]>);

        // Define category order - Active Sessions first, then the rest
        const categoryOrder = ['Active Sessions', 'Sessions', 'Navigation', 'Current Session', 'System', 'Developer', 'General', 'Results'];
        const sortedEntries = categoryOrder
            .filter(cat => grouped[cat])
            .map(cat => [cat, grouped[cat]] as [string, Command[]]);

        // Add any categories not in the predefined order at the end
        const remainingCategories = Object.entries(grouped)
            .filter(([cat]) => !categoryOrder.includes(cat));

        return [...sortedEntries, ...remainingCategories].map(([title, cmds]) => ({
            id: title.toLowerCase().replace(/\s+/g, '-'),
            title,
            commands: cmds
        }));
    }, [commands, searchQuery]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const handleSelectCommand = useCallback((command: Command) => {
        command.action();
        onClose();
    }, [onClose]);

    // Get flattened commands for keyboard navigation
    const allCommands = useMemo(() => {
        return filteredCategories.flatMap(cat => cat.commands);
    }, [filteredCategories]);

    const handleKeyPress = useCallback((key: string) => {
        switch(key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowDown':
                setSelectedIndex(prev => Math.min(prev + 1, allCommands.length - 1));
                break;
            case 'ArrowUp':
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                if (allCommands[selectedIndex]) {
                    handleSelectCommand(allCommands[selectedIndex]);
                }
                break;
        }
    }, [onClose, allCommands, selectedIndex, handleSelectCommand]);

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    return {
        searchQuery,
        selectedIndex,
        filteredCategories,
        inputRef,
        handleSearchChange,
        handleSelectCommand,
        handleKeyPress,
        setSelectedIndex,
    };
}