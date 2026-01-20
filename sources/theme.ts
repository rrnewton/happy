import { Platform } from 'react-native';

export const lightTheme = {
    dark: false,
    colors: {

        //
        // Main colors
        //

        text: '#000000',
        textDestructive: Platform.select({ ios: '#FF3B30', default: '#F44336' }),
        textSecondary: Platform.select({ ios: '#8E8E93', default: '#49454F' }),
        textLink: '#2BACCC',
        warningCritical: '#FF3B30',
        warning: '#8E8E93',
        success: '#34C759',
        surface: '#ffffff',
        surfaceRipple: 'rgba(0, 0, 0, 0.08)',
        surfacePressed: '#f0f0f2',
        surfaceSelected: Platform.select({ ios: '#C6C6C8', default: '#eaeaea' }),
        surfacePressedOverlay: Platform.select({ ios: '#D1D1D6', default: 'transparent' }),
        surfaceHigh: '#F8F8F8',
        surfaceHighest: '#f0f0f0',
        divider: Platform.select({ ios: '#eaeaea', default: '#eaeaea' }),
        shadow: {
            color: Platform.select({ default: '#000000', web: 'rgba(0, 0, 0, 0.1)' }),
            opacity: 0.1,
        },

        //
        // System components
        //

        groupped: {
            background: Platform.select({ ios: '#F2F2F7', default: '#F5F5F5' }),
            chevron: Platform.select({ ios: '#C7C7CC', default: '#49454F' }),
            sectionTitle: Platform.select({ ios: '#8E8E93', default: '#49454F' }),
        },
        header: {
            background: '#ffffff',
            tint: '#18171C'
        },
        switch: {
            track: {
                active: Platform.select({ ios: '#34C759', default: '#1976D2' }),
                inactive: '#dddddd',
            },
            thumb: {
                active: '#FFFFFF',
                inactive: '#767577',
            },
        },
        fab: {
            background: '#000000',
            backgroundPressed: '#1a1a1a',
            icon: '#FFFFFF',
        },
        radio: {
            active: '#007AFF',
            inactive: '#C0C0C0',
            dot: '#007AFF',
        },
        modal: {
            border: 'rgba(0, 0, 0, 0.1)'
        },
        button: {
            primary: {
                background: '#000000',
                tint: '#FFFFFF',
                disabled: '#C0C0C0',
            },
            secondary: {
                tint: '#666666',
            }
        },
        input: {
            background: '#F5F5F5',
            text: '#000000',
            placeholder: '#999999',
        },
        box: {
            warning: {
                background: '#FFF8F0',
                border: '#FF9500',
                text: '#FF9500',
            },
            error: {
                background: '#FFF0F0',
                border: '#FF3B30',
                text: '#FF3B30',
            }
        },

        //
        // App components
        //

        status: {
            connected: '#34C759',
            connecting: '#007AFF',
            disconnected: '#999999',
            error: '#FF3B30',
            default: '#8E8E93',
        },

        // Permission mode colors
        permission: {
            default: '#8E8E93',
            acceptEdits: '#007AFF',
            bypass: '#FF9500',
            plan: '#34C759',
            readOnly: '#8B8B8D',
            safeYolo: '#FF6B35',
            yolo: '#DC143C',
        },

        // Permission button colors
        permissionButton: {
            allow: {
                background: '#34C759',
                text: '#FFFFFF',
            },
            deny: {
                background: '#FF3B30',
                text: '#FFFFFF',
            },
            allowAll: {
                background: '#007AFF',
                text: '#FFFFFF',
            },
            inactive: {
                background: '#E5E5EA',
                border: '#D1D1D6',
                text: '#8E8E93',
            },
            selected: {
                background: '#F2F2F7',
                border: '#D1D1D6',
                text: '#3C3C43',
            },
        },


        // Diff view
        diff: {
            outline: '#E0E0E0',
            success: '#28A745',
            error: '#DC3545',
            // Traditional diff colors
            addedBg: '#E6FFED',
            addedBorder: '#34D058',
            addedText: '#24292E',
            removedBg: '#FFEEF0',
            removedBorder: '#D73A49',
            removedText: '#24292E',
            contextBg: '#F6F8FA',
            contextText: '#586069',
            lineNumberBg: '#F6F8FA',
            lineNumberText: '#959DA5',
            hunkHeaderBg: '#F1F8FF',
            hunkHeaderText: '#005CC5',
            leadingSpaceDot: '#E8E8E8',
            inlineAddedBg: '#ACFFA6',
            inlineAddedText: '#0A3F0A',
            inlineRemovedBg: '#FFCECB',
            inlineRemovedText: '#5A0A05',
        },

        // Message View colors
        userMessageBackground: '#f0eee6',
        userMessageBackgroundHighContrast: '#FFE066', // Vibrant yellow for high contrast mode
        userMessageText: '#000000',
        userMessageTextHighContrast: '#000000',
        userMessageLinkHighContrast: '#0055AA',
        userMessageCodeBackgroundHighContrast: 'rgba(0, 0, 0, 0.12)',
        agentMessageText: '#000000',
        agentEventText: '#666666',
        thinkingBackground: '#F5F0FF',

        // Code/Syntax colors
        syntaxKeyword: '#1d4ed8',
        syntaxString: '#059669',
        syntaxComment: '#6b7280',
        syntaxNumber: '#0891b2',
        syntaxFunction: '#9333ea',
        syntaxBracket1: '#ff6b6b',
        syntaxBracket2: '#4ecdc4',
        syntaxBracket3: '#45b7d1',
        syntaxBracket4: '#f7b731',
        syntaxBracket5: '#5f27cd',
        syntaxDefault: '#374151',

        // Git status colors
        gitBranchText: '#6b7280',
        gitFileCountText: '#6b7280',
        gitAddedText: '#22c55e',
        gitRemovedText: '#ef4444',

        // Terminal/Command colors
        terminal: {
            background: '#1E1E1E',
            prompt: '#34C759',
            command: '#E0E0E0',
            stdout: '#E0E0E0',
            stderr: '#FFB86C',
            error: '#FF5555',
            emptyOutput: '#6272A4',
        },

        // Debug panel content renderer colors
        debug: {
            json: {
                key: '#C41A16',          // Red - high contrast for keys
                string: '#1A7F37',       // Green - standard for strings
                number: '#0550AE',       // Blue - standard for numbers
                boolean: '#0550AE',      // Blue - same as numbers
                null: '#953800',         // Brown/Orange - distinctive
                bracket: '#24292F',      // Dark gray - subtle
                punctuation: '#57606A',  // Medium gray - colon, comma
            },
            error: {
                type: '#C41A16',         // Red for error type
                message: '#24292F',      // Dark text for message
                stack: '#57606A',        // Gray for stack trace
            },
            plain: '#24292F',            // Default text color
        },

        // Terminal-specific UI properties (disabled for light theme)
        terminalUI: {
            borderRadius: Platform.select({ ios: 10, default: 16 }),
            useMonospace: false,
            useBorders: false,
            borderColor: 'transparent',
            borderWidth: 0,
            // Text glow effect (disabled for light theme)
            textGlow: {
                enabled: false,
                color: 'transparent',
                radius: 0,
            },
        },

    },
};

export const darkTheme = {
    dark: true,
    colors: {

        //
        // Main colors
        //

        text: '#ffffff',
        textDestructive: Platform.select({ ios: '#FF453A', default: '#F48FB1' }),
        textSecondary: Platform.select({ ios: '#8E8E93', default: '#CAC4D0' }),
        textLink: '#2BACCC',
        warningCritical: '#FF453A',
        warning: '#8E8E93',
        success: '#32D74B',
        surface: Platform.select({ ios: '#18171C', default: '#212121' }),
        surfaceRipple: 'rgba(255, 255, 255, 0.08)',
        surfacePressed: '#2C2C2E',
        surfaceSelected: '#2C2C2E',
        surfacePressedOverlay: Platform.select({ ios: '#2C2C2E', default: 'transparent' }),
        // iOS dark theme is #1c1c1e for items, and #000 for the background
        surfaceHigh: Platform.select({ ios: '#2C2C2E', default: '#171717' }),
        surfaceHighest: Platform.select({ ios: '#38383A', default: '#292929' }),
        divider: Platform.select({ ios: '#38383A', default: '#292929' }),
        shadow: {
            color: Platform.select({ default: '#000000', web: 'rgba(0, 0, 0, 0.1)' }),
            opacity: 0.1,
        },

        //
        // System components
        //

        header: {
            background: Platform.select({ ios: '#18171C', default: '#212121' }),
            tint: '#ffffff'
        },
        switch: {
            track: {
                active: Platform.select({ ios: '#34C759', default: '#1976D2' }),
                inactive: '#3a393f',
            },
            thumb: {
                active: '#FFFFFF',
                inactive: '#767577',
            },
        },
        groupped: {
            background: Platform.select({ ios: '#1C1C1E', default: '#1e1e1e' }),
            chevron: Platform.select({ ios: '#48484A', default: '#CAC4D0' }),
            sectionTitle: Platform.select({ ios: '#8E8E93', default: '#CAC4D0' }),
        },
        fab: {
            background: '#FFFFFF',
            backgroundPressed: '#f0f0f0',
            icon: '#000000',
        },
        radio: {
            active: '#0A84FF',
            inactive: '#48484A',
            dot: '#0A84FF',
        },
        modal: {
            border: 'rgba(255, 255, 255, 0.1)'
        },
        button: {
            primary: {
                background: '#000000',
                tint: '#FFFFFF',
                disabled: '#48484A',
            },
            secondary: {
                tint: '#8E8E93',
            }
        },
        input: {
            background: Platform.select({ ios: '#1C1C1E', default: '#303030' }),
            text: '#FFFFFF',
            placeholder: '#8E8E93',
        },
        box: {
            warning: {
                background: 'rgba(255, 159, 10, 0.15)',
                border: '#FF9F0A',
                text: '#FFAB00',
            },
            error: {
                background: 'rgba(255, 69, 58, 0.15)',
                border: '#FF453A',
                text: '#FF6B6B',
            }
        },

        //
        // App components
        //

        status: { // App Connection Status
            connected: '#34C759',
            connecting: '#FFFFFF',
            disconnected: '#8E8E93',
            error: '#FF453A',
            default: '#8E8E93',
        },

        // Permission mode colors
        permission: {
            default: '#8E8E93',
            acceptEdits: '#0A84FF',
            bypass: '#FF9F0A',
            plan: '#32D74B',
            readOnly: '#98989D',
            safeYolo: '#FF7A4C',
            yolo: '#FF453A',
        },

        // Permission button colors
        permissionButton: {
            allow: {
                background: '#32D74B',
                text: '#FFFFFF',
            },
            deny: {
                background: '#FF453A',
                text: '#FFFFFF',
            },
            allowAll: {
                background: '#0A84FF',
                text: '#FFFFFF',
            },
            inactive: {
                background: '#2C2C2E',
                border: '#38383A',
                text: '#8E8E93',
            },
            selected: {
                background: '#1C1C1E',
                border: '#38383A',
                text: '#FFFFFF',
            },
        },


        // Diff view
        diff: {
            outline: '#30363D',
            success: '#3FB950',
            error: '#F85149',
            // Traditional diff colors for dark mode
            addedBg: '#0D2E1F',
            addedBorder: '#3FB950',
            addedText: '#C9D1D9',
            removedBg: '#3F1B23',
            removedBorder: '#F85149',
            removedText: '#C9D1D9',
            contextBg: '#161B22',
            contextText: '#8B949E',
            lineNumberBg: '#161B22',
            lineNumberText: '#6E7681',
            hunkHeaderBg: '#161B22',
            hunkHeaderText: '#58A6FF',
            leadingSpaceDot: '#2A2A2A',
            inlineAddedBg: '#2A5A2A',
            inlineAddedText: '#7AFF7A',
            inlineRemovedBg: '#5A2A2A',
            inlineRemovedText: '#FF7A7A',
        },

        // Message View colors
        userMessageBackground: '#3A352E',
        userMessageBackgroundHighContrast: '#1E5AA8', // Vibrant blue for high contrast mode in dark theme
        userMessageText: '#FFFFFF',
        userMessageTextHighContrast: '#FFFFFF',
        userMessageLinkHighContrast: '#7DD3FC',
        userMessageCodeBackgroundHighContrast: 'rgba(255, 255, 255, 0.15)',
        agentMessageText: '#FFFFFF',
        agentEventText: '#8E8E93',
        thinkingBackground: '#2A2440',

        // Code/Syntax colors (brighter for dark mode)
        syntaxKeyword: '#569CD6',
        syntaxString: '#CE9178',
        syntaxComment: '#6A9955',
        syntaxNumber: '#B5CEA8',
        syntaxFunction: '#DCDCAA',
        syntaxBracket1: '#FFD700',
        syntaxBracket2: '#DA70D6',
        syntaxBracket3: '#179FFF',
        syntaxBracket4: '#FF8C00',
        syntaxBracket5: '#00FF00',
        syntaxDefault: '#D4D4D4',

        // Git status colors
        gitBranchText: '#8E8E93',
        gitFileCountText: '#8E8E93',
        gitAddedText: '#34C759',
        gitRemovedText: '#FF453A',

        // Terminal/Command colors
        terminal: {
            background: '#1E1E1E',
            prompt: '#32D74B',
            command: '#E0E0E0',
            stdout: '#E0E0E0',
            stderr: '#FFB86C',
            error: '#FF6B6B',
            emptyOutput: '#7B7B93',
        },

        // Debug panel content renderer colors (dark mode)
        debug: {
            json: {
                key: '#FFD700',          // Gold - easier on eyes than pink, highly visible
                string: '#E6DB74',       // Yellow - Monokai standard
                number: '#AE81FF',       // Purple - Monokai standard
                boolean: '#AE81FF',      // Purple - same as numbers
                null: '#66D9EF',         // Cyan - Monokai keyword color
                bracket: '#F8F8F2',      // Light gray - subtle
                punctuation: '#F8F8F2',  // Light gray - colon, comma
            },
            error: {
                type: '#FF6B6B',         // Bright red for error type
                message: '#F8F8F2',      // Light text for message
                stack: '#ABB2BF',        // Gray for stack trace
            },
            plain: '#F8F8F2',            // Default text color
        },

        // Terminal-specific UI properties (disabled for dark theme)
        terminalUI: {
            borderRadius: Platform.select({ ios: 10, default: 16 }),
            useMonospace: false,
            useBorders: false,
            borderColor: 'transparent',
            borderWidth: 0,
            // Text glow effect (disabled for dark theme)
            textGlow: {
                enabled: false,
                color: 'transparent',
                radius: 0,
            },
        },

    },
} satisfies typeof lightTheme;

export const terminalTheme = {
    dark: true,
    colors: {

        //
        // Main colors - Amber terminal aesthetic
        //

        text: '#ffb000',
        textDestructive: '#ff4444',
        textSecondary: '#cc8800',
        textLink: '#00ccff',
        warningCritical: '#ff4444',
        warning: '#ffcc00',
        success: '#00ff88',
        surface: '#0a0a0a',
        surfaceRipple: 'rgba(255, 176, 0, 0.1)',
        surfacePressed: '#1a1a1a',
        surfaceSelected: '#2a1800',
        surfacePressedOverlay: '#1a1200',
        surfaceHigh: '#121212',
        surfaceHighest: '#1a1a1a',
        divider: '#2a2a2a',
        shadow: {
            color: '#000000',
            opacity: 0.3,
        },

        //
        // System components
        //

        header: {
            background: '#0a0a0a',
            tint: '#ffb000'
        },
        switch: {
            track: {
                active: '#ffb000',
                inactive: '#2a2a2a',
            },
            thumb: {
                active: '#0a0a0a',
                inactive: '#555555',
            },
        },
        groupped: {
            background: '#050505',
            chevron: '#ffb000',
            sectionTitle: '#cc8800',
        },
        fab: {
            background: '#ffb000',
            backgroundPressed: '#cc8800',
            icon: '#0a0a0a',
        },
        radio: {
            active: '#ffb000',
            inactive: '#3a3a3a',
            dot: '#ffb000',
        },
        modal: {
            border: 'rgba(255, 176, 0, 0.3)'
        },
        button: {
            primary: {
                background: '#ffb000',
                tint: '#0a0a0a',
                disabled: '#3a3a3a',
            },
            secondary: {
                tint: '#cc8800',
            }
        },
        input: {
            background: '#121212',
            text: '#ffb000',
            placeholder: '#666600',
        },
        box: {
            warning: {
                background: 'rgba(255, 204, 0, 0.15)',
                border: '#ffcc00',
                text: '#ffcc00',
            },
            error: {
                background: 'rgba(255, 68, 68, 0.15)',
                border: '#ff4444',
                text: '#ff6666',
            }
        },

        //
        // App components
        //

        status: {
            connected: '#00ff88',
            connecting: '#ffb000',
            disconnected: '#666600',
            error: '#ff4444',
            default: '#cc8800',
        },

        // Permission mode colors
        permission: {
            default: '#cc8800',
            acceptEdits: '#00ccff',
            bypass: '#ff9900',
            plan: '#00ff88',
            readOnly: '#666600',
            safeYolo: '#ff6600',
            yolo: '#ff4444',
        },

        // Permission button colors
        permissionButton: {
            allow: {
                background: '#00ff88',
                text: '#0a0a0a',
            },
            deny: {
                background: '#ff4444',
                text: '#0a0a0a',
            },
            allowAll: {
                background: '#00ccff',
                text: '#0a0a0a',
            },
            inactive: {
                background: '#1a1a1a',
                border: '#2a2a2a',
                text: '#666600',
            },
            selected: {
                background: '#2a1800',
                border: '#ffb000',
                text: '#ffb000',
            },
        },


        // Diff view - amber terminal style
        diff: {
            outline: '#2a2a2a',
            success: '#00ff88',
            error: '#ff4444',
            addedBg: '#1a2a1a',
            addedBorder: '#00ff88',
            addedText: '#00ff88',
            removedBg: '#2a1a1a',
            removedBorder: '#ff4444',
            removedText: '#ff6666',
            contextBg: '#0a0a0a',
            contextText: '#cc8800',
            lineNumberBg: '#0a0a0a',
            lineNumberText: '#666600',
            hunkHeaderBg: '#1a1a1a',
            hunkHeaderText: '#ffb000',
            leadingSpaceDot: '#2a2a2a',
            inlineAddedBg: '#1a3a1a',
            inlineAddedText: '#00ff88',
            inlineRemovedBg: '#3a1a1a',
            inlineRemovedText: '#ff6666',
        },

        // Message View colors - terminal style
        userMessageBackground: '#5A4000',
        userMessageBackgroundHighContrast: '#FFB000',
        userMessageText: '#ffb000',
        userMessageTextHighContrast: '#000000',
        userMessageLinkHighContrast: '#0066AA',
        userMessageCodeBackgroundHighContrast: 'rgba(0, 0, 0, 0.15)',
        agentMessageText: '#cc8800',
        agentEventText: '#666600',
        thinkingBackground: '#121200',

        // Code/Syntax colors - amber terminal palette
        syntaxKeyword: '#ffcc00',
        syntaxString: '#00ff88',
        syntaxComment: '#666600',
        syntaxNumber: '#00ccff',
        syntaxFunction: '#ff9900',
        syntaxBracket1: '#ffb000',
        syntaxBracket2: '#00ccff',
        syntaxBracket3: '#00ff88',
        syntaxBracket4: '#ff9900',
        syntaxBracket5: '#ff6600',
        syntaxDefault: '#cc8800',

        // Git status colors
        gitBranchText: '#cc8800',
        gitFileCountText: '#666600',
        gitAddedText: '#00ff88',
        gitRemovedText: '#ff4444',

        // Terminal/Command colors
        terminal: {
            background: '#0a0a0a',
            prompt: '#ffb000',
            command: '#ffcc00',
            stdout: '#cc8800',
            stderr: '#ff6600',
            error: '#ff4444',
            emptyOutput: '#666600',
        },

        // Debug panel content renderer colors
        debug: {
            json: {
                key: '#ffb000',
                string: '#00ff88',
                number: '#00ccff',
                boolean: '#00ccff',
                null: '#ff6600',
                bracket: '#cc8800',
                punctuation: '#666600',
            },
            error: {
                type: '#ff4444',
                message: '#ffb000',
                stack: '#666600',
            },
            plain: '#cc8800',
        },

        // Terminal-specific UI properties
        terminalUI: {
            // Keep rounded corners for consistency
            borderRadius: Platform.select({ ios: 10, default: 16 }),
            // Use monospace font
            useMonospace: true,
            // Border instead of shadow - adds that terminal panel look
            useBorders: true,
            borderColor: '#ffb000',
            borderWidth: 1,
            // Amber text glow for that phosphor CRT effect
            textGlow: {
                enabled: true,
                color: 'rgba(255, 176, 0, 0.6)',
                radius: 8,
            },
        },

    },
} satisfies typeof lightTheme;

export type Theme = typeof lightTheme;
