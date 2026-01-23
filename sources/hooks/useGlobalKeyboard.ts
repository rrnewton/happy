import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isMacPlatform } from '@/utils/keyboard';

/**
 * Keyboard shortcut handlers configuration
 */
export interface KeyboardHandlers {
    onCommandPalette?: () => void;
    onNewSession?: () => void;
    onArchiveSession?: () => void;
    onDeleteSession?: () => void;
    onForkSession?: () => void;
    onToggleVoiceRecording?: () => void;
    onSendWhileRecording?: () => void;
    isRecording?: () => boolean;
    onPrevSession?: () => void;
    onNextSession?: () => void;
    onFocusSearch?: () => void;
    onShowKeyboardShortcuts?: () => void;
    onToggleSidebar?: () => void;
}

// Double-tap detection threshold in milliseconds
const DOUBLE_TAP_THRESHOLD = 300;

/**
 * Hook for handling global keyboard shortcuts on web
 * Mac: ⌘K (palette), ⌘⇧O (new session), ⌘⇧A (archive), ⌘⇧⌫ (delete), ⌘⇧K (fork), ⌘⇧V (voice), ⌘⇧F (focus search), ⌘⇧? (shortcuts panel), ⌘B or ⌘1 (toggle sidebar)
 * Windows/Linux: Uses Ctrl instead of ⌘ for all shortcuts
 * Prev/Next session: ⌥↑/↓ on Mac, Ctrl+Shift+↑/↓ on Windows/Linux
 * Double-tap Shift: Toggle voice recording (web only)
 */
export function useGlobalKeyboard(onCommandPalette: () => void, handlers?: Omit<KeyboardHandlers, 'onCommandPalette'>) {
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }

        // Track last Shift key press time for double-tap detection
        let lastShiftPressTime = 0;
        // Track if Shift was released without any other key being pressed
        let shiftWasClean = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Platform-specific modifier key handling
            const isMac = isMacPlatform();
            // On Mac: use Cmd (metaKey), on Windows/Linux: use Ctrl
            const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
            const isShiftPressed = e.shiftKey;

            // Track Shift key presses for double-tap detection
            // Only consider it a "clean" Shift press if no other modifiers are held
            if (e.key === 'Shift' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                shiftWasClean = true;
            } else if (isShiftPressed) {
                // Any other key pressed while Shift is held makes it not a clean Shift tap
                shiftWasClean = false;
            }

            // ⌘K - Open command palette (without shift - ⌘⇧K is fork session)
            if (isModifierPressed && !isShiftPressed && e.key === 'k') {
                e.preventDefault();
                e.stopPropagation();
                onCommandPalette();
                return;
            }

            // ⌘⇧O - New session
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onNewSession?.();
                return;
            }

            // ⌘⇧A - Archive session
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onArchiveSession?.();
                return;
            }

            // ⌘⇧⌫ (Shift+Backspace) - Delete session
            if (isModifierPressed && isShiftPressed && e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onDeleteSession?.();
                return;
            }

            // ⌘⇧K - Fork session (continue from here)
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onForkSession?.();
                return;
            }

            // ⌘⇧V - Toggle voice recording
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onToggleVoiceRecording?.();
                return;
            }

            // Previous session: ⌥↑ on Mac, Ctrl+Shift+↑ on Windows/Linux
            const prevNextMac = isMac && e.altKey && !e.ctrlKey && !e.shiftKey;
            const prevNextWin = !isMac && e.ctrlKey && e.shiftKey && !e.altKey;

            if ((prevNextMac || prevNextWin) && e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onPrevSession?.();
                return;
            }

            // Next session: ⌥↓ on Mac, Ctrl+Shift+↓ on Windows/Linux
            if ((prevNextMac || prevNextWin) && e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onNextSession?.();
                return;
            }

            // ⌘⇧F - Focus search
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onFocusSearch?.();
                return;
            }

            // ⌘⇧? - Show keyboard shortcuts (? is Shift+/ on most keyboards)
            if (isModifierPressed && isShiftPressed && (e.key === '?' || e.key === '/')) {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onShowKeyboardShortcuts?.();
                return;
            }

            // ⌘B or ⌘1 - Toggle sidebar (without shift)
            if (isModifierPressed && !isShiftPressed && (e.key.toLowerCase() === 'b' || e.key === '1')) {
                e.preventDefault();
                e.stopPropagation();
                handlers?.onToggleSidebar?.();
                return;
            }

            // Enter key - send while recording (only when not focused on an input)
            // This allows sending during voice recording even when the input is not focused
            if (e.key === 'Enter' && !isModifierPressed && !isShiftPressed) {
                // Check if we're recording and have a send handler
                if (handlers?.isRecording?.() && handlers?.onSendWhileRecording) {
                    // Check if the active element is an input/textarea - if so, let the input handle it
                    const activeElement = document.activeElement;
                    const isInputFocused = activeElement instanceof HTMLInputElement ||
                        activeElement instanceof HTMLTextAreaElement ||
                        activeElement?.getAttribute('contenteditable') === 'true';

                    if (!isInputFocused) {
                        e.preventDefault();
                        e.stopPropagation();
                        handlers.onSendWhileRecording();
                        return;
                    }
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Double-tap Shift detection for voice recording
            if (e.key === 'Shift' && shiftWasClean) {
                const now = Date.now();
                if (now - lastShiftPressTime < DOUBLE_TAP_THRESHOLD) {
                    // Double-tap detected - trigger voice recording
                    e.preventDefault();
                    e.stopPropagation();
                    handlers?.onToggleVoiceRecording?.();
                    // Reset to prevent triple-tap from triggering again
                    lastShiftPressTime = 0;
                } else {
                    // First tap - record the time
                    lastShiftPressTime = now;
                }
            }
            // Reset clean state on any key release
            if (e.key === 'Shift') {
                shiftWasClean = false;
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onCommandPalette, handlers]);
}