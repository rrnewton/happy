import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useLocalSetting } from '@/sync/storage';

/**
 * Hook that automatically copies selected text to clipboard on web.
 *
 * This is a common feature in terminal emulators and developer tools
 * (like iTerm2, Hyper terminal). When enabled, any text selection
 * is automatically copied to the clipboard after a 500ms debounce
 * to avoid copying while the user is still selecting.
 *
 * Only active on web platform and when the setting is enabled.
 */
export function useAutoCopyOnSelection() {
    const autoCopyEnabled = useLocalSetting('autoCopyOnSelection');
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Only run on web and when enabled
        if (Platform.OS !== 'web' || !autoCopyEnabled) {
            return;
        }

        const handleSelectionChange = () => {
            // Clear any pending debounce
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // Debounce to avoid copying while still selecting
            debounceTimeoutRef.current = setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection?.toString().trim();

                if (selectedText && selectedText.length > 0) {
                    navigator.clipboard.writeText(selectedText).catch(() => {
                        // Silently fail - user can still use Cmd+C
                    });
                }
            }, 500);
        };

        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [autoCopyEnabled]);
}
