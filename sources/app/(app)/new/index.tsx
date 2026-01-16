import React from 'react';
import { View, Text, Platform, Pressable, useWindowDimensions, TextInput } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useAllMachines, storage, useSetting } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { useResponsiveMaxWidth } from '@/components/layout';
import { t } from '@/text';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AgentInput } from '@/components/AgentInput';
import { MultiTextInputHandle } from '@/components/MultiTextInput';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { machineSpawnNewSession } from '@/sync/ops';
import { Modal } from '@/modal';
import { sync } from '@/sync/sync';
import { SessionTypeSelector } from '@/components/SessionTypeSelector';
import { createWorktree } from '@/utils/createWorktree';
import { generateWorktreeName } from '@/utils/generateWorktreeName';
import { getTempData, type NewSessionData } from '@/utils/tempDataStore';
import { linkTaskToSession } from '@/-zen/model/taskSessionLink';
import { PermissionMode, ModelMode } from '@/components/PermissionModeSelector';
import { useImageAttachments } from '@/hooks/useImageAttachments';
import { hapticsHeavy } from '@/components/haptics';
import { useWhisperTranscription, TranscriptionStatus } from '@/hooks/useWhisperTranscription';
import { useGlobalKeyboard } from '@/hooks/useGlobalKeyboard';
import { CommandPalette } from '@/components/CommandPalette';
import { isMacPlatform } from '@/utils/keyboard';

// Simple temporary state for passing selections back from picker screens
let onMachineSelected: (machineId: string) => void = () => { };
let onPathSelected: (path: string) => void = () => { };
export const callbacks = {
    onMachineSelected: (machineId: string) => {
        onMachineSelected(machineId);
    },
    onPathSelected: (path: string) => {
        onPathSelected(path);
    }
}

// Type for recent machine paths with environment settings
// Note: envSetIds can be:
// - undefined: user never explicitly selected envs for this path (use defaults with applyByDefault=true)
// - string[]: ordered array of selected environment set IDs (empty array = explicitly no envs)
type RecentMachinePath = {
    machineId: string;
    path: string;
    envSetIds?: string[];
    customEnvVars?: Record<string, string>;
};

// Helper function to get the most recent path for a machine from settings or sessions
const getRecentPathForMachine = (machineId: string | null, recentPaths: RecentMachinePath[]): string => {
    if (!machineId) return '/home/';

    // First check recent paths from settings
    const recentPath = recentPaths.find(rp => rp.machineId === machineId);
    if (recentPath) {
        return recentPath.path;
    }

    // Fallback to session history
    const machine = storage.getState().machines[machineId];
    const defaultPath = machine?.metadata?.homeDir || '/home/';

    const sessions = Object.values(storage.getState().sessions);
    const pathsWithTimestamps: Array<{ path: string; timestamp: number }> = [];
    const pathSet = new Set<string>();

    sessions.forEach(session => {
        if (session.metadata?.machineId === machineId && session.metadata?.path) {
            const path = session.metadata.path;
            if (!pathSet.has(path)) {
                pathSet.add(path);
                pathsWithTimestamps.push({
                    path,
                    timestamp: session.updatedAt || session.createdAt
                });
            }
        }
    });

    // Sort by most recent first
    pathsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

    return pathsWithTimestamps[0]?.path || defaultPath;
};

// Helper function to get last used environment for a machine+path combination
// Returns an ordered array of environment set IDs
const getRecentEnvForPath = (
    machineId: string | null,
    path: string,
    recentPaths: RecentMachinePath[],
    environmentSets: Array<{ id: string; applyByDefault?: boolean }>
): { envSetIds: string[]; customEnvVars: Record<string, string> } => {
    if (!machineId) return { envSetIds: [], customEnvVars: {} };

    // Build a set of existing environment set IDs for validation
    const existingSetIds = new Set(environmentSets.map(s => s.id));

    // Find matching recent entry for this machine+path
    const recentEntry = recentPaths.find(rp => rp.machineId === machineId && rp.path === path);
    if (recentEntry) {
        // Check if user explicitly selected envs (including empty array for "no envs")
        // vs never having selected (undefined)
        if (recentEntry.envSetIds !== undefined) {
            // Filter out any deleted environment sets
            const validIds = recentEntry.envSetIds.filter(id => existingSetIds.has(id));
            return {
                envSetIds: validIds,
                customEnvVars: recentEntry.customEnvVars || {},
            };
        }
        // envSetIds is undefined - user has used this path but never explicitly selected envs
        // Fall through to default logic below, but preserve any custom vars
        const defaultIds = environmentSets.filter(s => s.applyByDefault).map(s => s.id);
        return {
            envSetIds: defaultIds,
            customEnvVars: recentEntry.customEnvVars || {},
        };
    }

    // No recent entry - use all environment sets with applyByDefault=true
    const defaultIds = environmentSets.filter(s => s.applyByDefault).map(s => s.id);
    return {
        envSetIds: defaultIds,
        customEnvVars: {},
    };
};

// Helper function to update recent machine paths
const updateRecentMachinePaths = (
    currentPaths: RecentMachinePath[],
    machineId: string,
    path: string,
    envSetIds: string[],
    customEnvVars?: Record<string, string>
): RecentMachinePath[] => {
    // Remove any existing entry for this machine+path combination
    const filtered = currentPaths.filter(rp => !(rp.machineId === machineId && rp.path === path));
    // Add new entry at the beginning
    const newEntry: RecentMachinePath = { machineId, path };
    // Always save envSetIds (even empty array means explicit "no envs" selection)
    newEntry.envSetIds = envSetIds;
    if (customEnvVars && Object.keys(customEnvVars).length > 0) newEntry.customEnvVars = customEnvVars;
    const updated = [newEntry, ...filtered];
    // Keep only the last 10 entries
    return updated.slice(0, 10);
};

function NewSessionScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const maxWidth = useResponsiveMaxWidth();
    const { prompt, dataId, selectedMachineId: selectedMachineIdParam, selectedPathParam, resumeClaudeSessionId, selectedEnvSetIdsJson: selectedEnvSetIdsJsonParam, customEnvVarsJson } = useLocalSearchParams<{
        prompt?: string;
        dataId?: string;
        selectedMachineId?: string;
        selectedPathParam?: string;
        resumeClaudeSessionId?: string;
        selectedEnvSetIdsJson?: string;
        customEnvVarsJson?: string;
    }>();

    // Try to get data from temporary store first, fallback to direct prompt parameter
    const tempSessionData = React.useMemo(() => {
        if (dataId) {
            return getTempData<NewSessionData>(dataId);
        }
        return null;
    }, [dataId]);

    const [input, setInput] = React.useState(() => {
        if (tempSessionData?.prompt) {
            return tempSessionData.prompt;
        }
        return prompt || '';
    });
    const [isSending, setIsSending] = React.useState(false);
    const [sessionType, setSessionType] = React.useState<'simple' | 'worktree'>('simple');
    const [worktreeName, setWorktreeName] = React.useState(() => generateWorktreeName());
    const [manualResumeSessionId, setManualResumeSessionId] = React.useState(resumeClaudeSessionId || '');
    const ref = React.useRef<MultiTextInputHandle>(null);

    // Image attachments state
    const {
        attachments: imageAttachments,
        removeAttachment: removeImageAttachment,
        clearAttachments: clearImageAttachments,
        pickImage,
        handlePaste,
    } = useImageAttachments();
    const [uploadingImageIds, setUploadingImageIds] = React.useState<Set<string>>(new Set());
    const headerHeight = useHeaderHeight();
    const safeArea = useSafeAreaInsets();
    const screenWidth = useWindowDimensions().width;

    // Ref to track current selection for cursor-aware transcription insertion
    const selectionRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

    // Ref to track if we're in auto-send mode (long-press recording)
    // When true, transcription completion will automatically create session and send
    const autoSendModeRef = React.useRef(false);
    const sendAfterTranscriptionRef = React.useRef(false);

    // Ref to hold the doCreate function for auto-send mode
    const doCreateRef = React.useRef<((overrideInput?: string) => Promise<void>) | null>(null);

    // Transcription callback - handles cursor-aware insertion or auto-send
    const handleTranscription = React.useCallback((text: string) => {
        // Check if we're in auto-send mode (long-press recording)
        const shouldAutoSend = autoSendModeRef.current;
        const shouldSendAfterTranscription = sendAfterTranscriptionRef.current;

        // Reset auto-send mode immediately
        autoSendModeRef.current = false;
        sendAfterTranscriptionRef.current = false;

        if (shouldAutoSend && text.trim()) {
            // In auto-send mode: set the input and trigger create
            setInput(text.trim());
            // Use setTimeout to ensure state is updated before calling doCreate
            setTimeout(() => {
                doCreateRef.current?.();
            }, 0);
        } else {
            // Normal mode: insert text at cursor position
            setInput(prev => {
                const { start, end } = selectionRef.current;
                let newText = text;

                if (prev) {
                    // Insert at cursor position
                    const before = prev.slice(0, start);
                    const after = prev.slice(end);

                    // Add space before if there's text before and it doesn't end with whitespace
                    const needsSpaceBefore = before.length > 0 && !/\s$/.test(before);
                    // Add space after if there's text after and it doesn't start with whitespace
                    const needsSpaceAfter = after.length > 0 && !/^\s/.test(after);

                    const insertText = (needsSpaceBefore ? ' ' : '') + text + (needsSpaceAfter ? ' ' : '');
                    newText = before + insertText + after;

                    // Update selection ref to position cursor after inserted text
                    const newCursorPos = start + insertText.length;
                    selectionRef.current = { start: newCursorPos, end: newCursorPos };
                }

                if (shouldSendAfterTranscription) {
                    setTimeout(() => {
                        doCreateRef.current?.(newText);
                    }, 0);
                }

                return newText;
            });
        }
    }, []);

    // Error callback
    const handleTranscriptionError = React.useCallback((error: string) => {
        // Reset auto-send mode on error
        autoSendModeRef.current = false;
        sendAfterTranscriptionRef.current = false;
        Modal.alert(t('common.error'), error);
    }, []);

    // Use whisper transcription hook
    const {
        status: transcriptionStatus,
        startRecording,
        stopRecording,
        cancelRecording,
        isRecording,
    } = useWhisperTranscription({
        onTranscription: handleTranscription,
        onError: handleTranscriptionError,
    });

    // Handle microphone button press - toggle recording
    const handleMicrophonePress = React.useCallback(async () => {
        if (transcriptionStatus === 'transcribing') {
            return; // Prevent actions during transcription
        }
        if (isRecording()) {
            // Stop recording and start transcription
            stopRecording();
        } else {
            // Start recording
            await startRecording();
        }
    }, [transcriptionStatus, isRecording, stopRecording, startRecording]);

    // Handle long press on mic button - start auto-send mode recording
    const handleMicLongPressStart = React.useCallback(async () => {
        if (transcriptionStatus !== 'idle') {
            return; // Only start from idle state
        }
        // Enable auto-send mode
        autoSendModeRef.current = true;
        // Provide haptic feedback to indicate auto-send mode
        hapticsHeavy();
        // Start recording
        const started = await startRecording();
        if (!started) {
            // Reset auto-send mode if recording failed to start
            autoSendModeRef.current = false;
        }
    }, [transcriptionStatus, startRecording]);

    // Handle press out on mic button - stop recording if in auto-send mode
    const handleMicPressOut = React.useCallback(() => {
        // Only stop if we're currently recording and in auto-send mode
        if (isRecording() && autoSendModeRef.current) {
            stopRecording();
        }
    }, [isRecording, stopRecording]);

    const handleSendWhileRecording = React.useCallback(() => {
        if (transcriptionStatus === 'transcribing') {
            return;
        }
        if (!isRecording()) {
            return;
        }
        autoSendModeRef.current = false;
        sendAfterTranscriptionRef.current = true;
        stopRecording();
    }, [transcriptionStatus, isRecording, stopRecording]);

    // Memoize mic button state to prevent flashing during transitions
    const micButtonState = React.useMemo(() => ({
        onMicPress: handleMicrophonePress,
        onMicLongPressStart: handleMicLongPressStart,
        onMicPressOut: handleMicPressOut,
        micStatus: transcriptionStatus === 'error' ? 'idle' : transcriptionStatus
    }), [handleMicrophonePress, handleMicLongPressStart, handleMicPressOut, transcriptionStatus]);

    // Load recent machine paths and last used agent from settings
    const recentMachinePaths = useSetting('recentMachinePaths');
    const lastUsedAgent = useSetting('lastUsedAgent');
    const lastUsedPermissionMode = useSetting('lastUsedPermissionMode');
    const lastUsedModelMode = useSetting('lastUsedModelMode');
    const environmentSets = useSetting('environmentSets');

    //
    // Environment selection state - multi-select array
    //
    const [selectedEnvSetIds, setSelectedEnvSetIds] = React.useState<string[]>(() => {
        // Check if env sets were provided in URL params
        if (selectedEnvSetIdsJsonParam) {
            try {
                const parsed = JSON.parse(selectedEnvSetIdsJsonParam);
                if (Array.isArray(parsed)) {
                    // Filter out any IDs that no longer exist
                    const existingIds = new Set(environmentSets.map(s => s.id));
                    return parsed.filter((id): id is string => typeof id === 'string' && existingIds.has(id));
                }
            } catch {
                // Fall through to defaults
            }
        }
        // Otherwise, select all environment sets with applyByDefault=true
        return environmentSets.filter(s => s.applyByDefault).map(s => s.id);
    });
    const [customEnvVars, setCustomEnvVars] = React.useState<Record<string, string>>(() => {
        if (customEnvVarsJson) {
            try {
                return JSON.parse(customEnvVarsJson);
            } catch {
                return {};
            }
        }
        return {};
    });

    //
    // Machines state
    //

    const machines = useAllMachines();
    const [selectedMachineId, setSelectedMachineId] = React.useState<string | null>(() => {
        if (machines.length > 0) {
            // Check if we have a recently used machine that's currently available
            if (recentMachinePaths.length > 0) {
                // Find the first machine from recent paths that's currently available
                for (const recent of recentMachinePaths) {
                    if (machines.find(m => m.id === recent.machineId)) {
                        return recent.machineId;
                    }
                }
            }
            // Fallback to first machine if no recent machine is available
            return machines[0].id;
        }
        return null;
    });
    React.useEffect(() => {
        if (machines.length > 0) {
            if (!selectedMachineId) {
                // No machine selected yet, prefer the most recently used machine
                let machineToSelect = machines[0].id; // Default to first machine

                // Check if we have a recently used machine that's currently available
                if (recentMachinePaths.length > 0) {
                    for (const recent of recentMachinePaths) {
                        if (machines.find(m => m.id === recent.machineId)) {
                            machineToSelect = recent.machineId;
                            break; // Use the first (most recent) match
                        }
                    }
                }

                setSelectedMachineId(machineToSelect);
                // Also set the best path for the selected machine
                const bestPath = getRecentPathForMachine(machineToSelect, recentMachinePaths);
                setSelectedPath(bestPath);
            } else {
                // Machine is already selected, but check if we need to update path
                // This handles the case where machines load after initial render
                const currentMachine = machines.find(m => m.id === selectedMachineId);
                if (currentMachine) {
                    // Update path based on recent paths (only if path hasn't been manually changed)
                    const bestPath = getRecentPathForMachine(selectedMachineId, recentMachinePaths);
                    setSelectedPath(prevPath => {
                        // Only update if current path is the default /home/
                        if (prevPath === '/home/' && bestPath !== '/home/') {
                            return bestPath;
                        }
                        return prevPath;
                    });
                }
            }
        }
    }, [machines, selectedMachineId, recentMachinePaths]);

    // Handle machine and path selection from navigation params (more reliable than callbacks)
    // Combined into a single effect to avoid race conditions between machine and path updates
    React.useEffect(() => {
        if (selectedMachineIdParam) {
            setSelectedMachineId(selectedMachineIdParam);
            // Only update path from machine's best path if no explicit path param was provided
            if (!selectedPathParam) {
                const bestPath = getRecentPathForMachine(selectedMachineIdParam, recentMachinePaths);
                setSelectedPath(bestPath);
            }
        }
        if (selectedPathParam) {
            // Explicit path selection always wins
            setSelectedPath(selectedPathParam);
        }
    }, [selectedMachineIdParam, selectedPathParam, recentMachinePaths]);

    // Legacy callback handlers (kept for backwards compatibility, but nav params are preferred)
    React.useEffect(() => {
        let handler = (machineId: string) => {
            setSelectedMachineId(machineId);
            const bestPath = getRecentPathForMachine(machineId, recentMachinePaths);
            setSelectedPath(bestPath);
        };
        onMachineSelected = handler;
        return () => {
            onMachineSelected = () => { };
        };
    }, [recentMachinePaths]);

    React.useEffect(() => {
        let handler = (path: string) => {
            setSelectedPath(path);
        };
        onPathSelected = handler;
        return () => {
            onPathSelected = () => { };
        };
    }, []);

    const handleMachineClick = React.useCallback(() => {
        router.navigate('/new/pick/machine');
    }, []);

    const handleEnvironmentClick = React.useCallback(() => {
        router.navigate({
            pathname: '/new/pick/environment',
            params: {
                selectedEnvSetIdsJson: JSON.stringify(selectedEnvSetIds),
                customEnvVarsJson: Object.keys(customEnvVars).length > 0 ? JSON.stringify(customEnvVars) : '',
            }
        });
    }, [selectedEnvSetIds, customEnvVars, router]);

    // Get display name for selected environments (multi-select)
    const selectedEnvDisplayName = React.useMemo(() => {
        const customCount = Object.keys(customEnvVars).length;

        if (selectedEnvSetIds.length === 0 && customCount === 0) {
            return t('environmentPicker.none');
        }

        // Get names of selected sets (in order)
        const selectedSets = selectedEnvSetIds
            .map(id => environmentSets.find(s => s.id === id))
            .filter((s): s is NonNullable<typeof s> => s !== undefined);

        if (selectedSets.length === 0) {
            // Only custom vars
            if (customCount > 0) {
                return t('environmentPicker.customOnly', { count: customCount });
            }
            return t('environmentPicker.none');
        }

        // Build display name from selected set names
        let displayName: string;
        if (selectedSets.length === 1) {
            displayName = selectedSets[0].name;
        } else if (selectedSets.length === 2) {
            displayName = `${selectedSets[0].name}, ${selectedSets[1].name}`;
        } else {
            displayName = `${selectedSets[0].name}, ${selectedSets[1].name} +${selectedSets.length - 2}`;
        }

        // Add custom var count if any
        if (customCount > 0) {
            displayName += ` +${customCount} custom`;
        }

        return displayName;
    }, [selectedEnvSetIds, customEnvVars, environmentSets]);

    //
    // Agent selection
    //

    const [agentType, setAgentType] = React.useState<'claude' | 'codex'>(() => {
        // Check if agent type was provided in temp data
        if (tempSessionData?.agentType) {
            return tempSessionData.agentType;
        }
        // Initialize with last used agent if valid, otherwise default to 'claude'
        if (lastUsedAgent === 'claude' || lastUsedAgent === 'codex') {
            return lastUsedAgent;
        }
        return 'claude';
    });

    const handleAgentClick = React.useCallback(() => {
        setAgentType(prev => {
            const newAgent = prev === 'claude' ? 'codex' : 'claude';
            // Save the new selection immediately
            sync.applySettings({ lastUsedAgent: newAgent });
            return newAgent;
        });
    }, []);

    //
    // Permission and Model Mode selection
    //

    const [permissionMode, setPermissionMode] = React.useState<PermissionMode>(() => {
        // Initialize with last used permission mode if valid, otherwise default to YOLO mode
        const validClaudeModes: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypassPermissions'];
        const validCodexModes: PermissionMode[] = ['default', 'read-only', 'safe-yolo', 'yolo'];

        if (lastUsedPermissionMode) {
            if (agentType === 'codex' && validCodexModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            } else if (agentType === 'claude' && validClaudeModes.includes(lastUsedPermissionMode as PermissionMode)) {
                return lastUsedPermissionMode as PermissionMode;
            }
        }
        // Default to YOLO mode (bypassPermissions for Claude, yolo for Codex)
        return agentType === 'codex' ? 'yolo' : 'bypassPermissions';
    });

    const [modelMode, setModelMode] = React.useState<ModelMode>(() => {
        // Initialize with last used model mode if valid, otherwise default
        const validClaudeModes: ModelMode[] = ['default', 'adaptiveUsage', 'sonnet', 'opus'];
        const validCodexModes: ModelMode[] = ['gpt-5-codex-high', 'gpt-5-codex-medium', 'gpt-5-codex-low', 'default', 'gpt-5-minimal', 'gpt-5-low', 'gpt-5-medium', 'gpt-5-high'];

        if (lastUsedModelMode) {
            if (agentType === 'codex' && validCodexModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            } else if (agentType === 'claude' && validClaudeModes.includes(lastUsedModelMode as ModelMode)) {
                return lastUsedModelMode as ModelMode;
            }
        }
        return agentType === 'codex' ? 'gpt-5-codex-high' : 'default';
    });

    // Reset permission and model modes when agent type changes
    React.useEffect(() => {
        if (agentType === 'codex') {
            // Switch to codex-compatible modes (default to YOLO)
            setPermissionMode('yolo');
            setModelMode('gpt-5-codex-high');
        } else {
            // Switch to claude-compatible modes (default to YOLO/bypassPermissions)
            setPermissionMode('bypassPermissions');
            setModelMode('default');
        }
    }, [agentType]);

    const handlePermissionModeChange = React.useCallback((mode: PermissionMode) => {
        setPermissionMode(mode);
        // Save the new selection immediately
        sync.applySettings({ lastUsedPermissionMode: mode });
    }, []);

    const handleModelModeChange = React.useCallback((mode: ModelMode) => {
        setModelMode(mode);
        // Save the new selection immediately
        sync.applySettings({ lastUsedModelMode: mode });
    }, []);

    //
    // Path selection
    //

    const [selectedPath, setSelectedPath] = React.useState<string>(() => {
        // Initialize with the path from the selected machine (which should be the most recent if available)
        return getRecentPathForMachine(selectedMachineId, recentMachinePaths);
    });
    const handlePathClick = React.useCallback(() => {
        if (selectedMachineId) {
            router.navigate(`/new/pick/path?machineId=${selectedMachineId}`);
        }
    }, [selectedMachineId, router]);

    // Handle environment selection from navigation params
    React.useEffect(() => {
        if (selectedEnvSetIdsJsonParam !== undefined) {
            try {
                const parsed = JSON.parse(selectedEnvSetIdsJsonParam);
                if (Array.isArray(parsed)) {
                    // Filter out any IDs that no longer exist
                    const existingIds = new Set(environmentSets.map(s => s.id));
                    setSelectedEnvSetIds(parsed.filter((id): id is string => typeof id === 'string' && existingIds.has(id)));
                }
            } catch {
                // Keep current selection on parse error
            }
        }
        if (customEnvVarsJson) {
            try {
                setCustomEnvVars(JSON.parse(customEnvVarsJson));
            } catch {
                setCustomEnvVars({});
            }
        }
    }, [selectedEnvSetIdsJsonParam, customEnvVarsJson, environmentSets]);

    // Update environment selection when path changes (restore last used env for this path)
    React.useEffect(() => {
        if (selectedMachineId && selectedPath && !selectedEnvSetIdsJsonParam && !customEnvVarsJson) {
            const envInfo = getRecentEnvForPath(selectedMachineId, selectedPath, recentMachinePaths, environmentSets);
            setSelectedEnvSetIds(envInfo.envSetIds);
            setCustomEnvVars(envInfo.customEnvVars);
        }
    }, [selectedMachineId, selectedPath, recentMachinePaths, environmentSets, selectedEnvSetIdsJsonParam, customEnvVarsJson]);

    // Get selected machine name
    const selectedMachine = React.useMemo(() => {
        if (!selectedMachineId) return null;
        return machines.find(m => m.id === selectedMachineId);
    }, [selectedMachineId, machines]);

    // Autofocus on initial mount and when screen gains focus (e.g., navigating back)
    useFocusEffect(
        React.useCallback(() => {
            // Small delay to ensure the screen is fully mounted/focused
            const timer = setTimeout(() => {
                ref.current?.focus();
            }, Platform.OS === 'ios' ? 300 : 100);
            return () => clearTimeout(timer);
        }, [])
    );

    // Check if command palette is enabled
    const commandPaletteEnabled = storage(state => state.localSettings.commandPaletteEnabled);

    // Handler for showing command palette (⌘K)
    const showCommandPalette = React.useCallback(() => {
        if (Platform.OS !== 'web' || !commandPaletteEnabled) return;

        // Note: The actual commands are managed by CommandPaletteProvider
        // We just trigger the modal here
        Modal.show({
            component: CommandPalette,
            props: {
                // Commands will be provided by the CommandPaletteProvider context
                commands: [],
            }
        } as any);
    }, [commandPaletteEnabled]);

    // Handler for toggling voice recording via keyboard shortcut (⌘⇧V)
    const handleToggleVoiceRecording = React.useCallback(async () => {
        if (Platform.OS !== 'web' || !commandPaletteEnabled) return;
        // Don't toggle if currently transcribing
        if (transcriptionStatus === 'transcribing') return;

        if (isRecording()) {
            stopRecording();
        } else {
            await startRecording();
        }
    }, [commandPaletteEnabled, transcriptionStatus, isRecording, stopRecording, startRecording]);

    // Setup global keyboard shortcuts with command palette support
    const keyboardHandlers = React.useMemo(() => ({
        onToggleVoiceRecording: handleToggleVoiceRecording,
        // We can add more handlers here as needed (e.g., for new session, etc.)
    }), [handleToggleVoiceRecording]);

    // Use global keyboard handler for command palette support
    useGlobalKeyboard(
        commandPaletteEnabled ? showCommandPalette : () => {},
        commandPaletteEnabled ? keyboardHandlers : undefined
    );

    // Additional keyboard shortcuts for selecting path (Cmd+Shift+P), machine (Cmd+Shift+M), and agent (Cmd+Shift+C) - Web only
    React.useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Platform-specific modifier key handling
            const isMac = isMacPlatform();
            // On Mac: use Cmd (metaKey), on Windows/Linux: use Ctrl
            const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
            const isShiftPressed = e.shiftKey;

            // Cmd+Shift+P - Open path selector
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                e.stopPropagation();
                if (selectedMachineId) {
                    router.navigate(`/new/pick/path?machineId=${selectedMachineId}`);
                }
                return;
            }

            // Cmd+Shift+M - Open machine selector
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                e.stopPropagation();
                handleMachineClick();
                return;
            }

            // Cmd+Shift+C - Toggle agent (Codex/Claude)
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                e.stopPropagation();
                handleAgentClick();
                return;
            }

            // Cmd+Shift+E - Open environment picker
            if (isModifierPressed && isShiftPressed && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                e.stopPropagation();
                handleEnvironmentClick();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedMachineId, router, handleMachineClick, handleAgentClick, handleEnvironmentClick]);

    // Create
    const doCreate = React.useCallback(async (overrideInput?: string) => {
        // Prevent duplicate sends
        if (isSending) {
            return;
        }

        if (!selectedMachineId) {
            Modal.alert(t('common.error'), t('newSession.noMachineSelected'));
            return;
        }
        if (!selectedPath) {
            Modal.alert(t('common.error'), t('newSession.noPathSelected'));
            return;
        }

        // Save input before clearing - will restore on failure
        const currentInput = overrideInput ?? input;
        setInput('');

        setIsSending(true);
        try {
            let actualPath = selectedPath;
            
            // Handle worktree creation if selected
            if (sessionType === 'worktree') {
                const worktreeResult = await createWorktree(selectedMachineId, selectedPath, worktreeName);
                
                if (!worktreeResult.success) {
                    // Restore input on failure
                    setInput(currentInput);
                    if (worktreeResult.error === 'Not a Git repository') {
                        Modal.alert(
                            t('common.error'),
                            t('newSession.worktree.notGitRepo')
                        );
                    } else {
                        Modal.alert(
                            t('common.error'),
                            t('newSession.worktree.failed', { error: worktreeResult.error || 'Unknown error' })
                        );
                    }
                    setIsSending(false);
                    return;
                }
                
                // Update the path to the new worktree location
                actualPath = worktreeResult.worktreePath;
            }

            // Save the machine-path-env combination to settings before sending
            const updatedPaths = updateRecentMachinePaths(
                recentMachinePaths,
                selectedMachineId,
                selectedPath,
                selectedEnvSetIds,
                customEnvVars
            );
            sync.applySettings({ recentMachinePaths: updatedPaths });

            // Merge environment variables: all selected sets in order + custom overrides
            // Later sets override earlier ones, custom vars override everything
            let mergedEnvVars: Record<string, string> = {};
            for (const setId of selectedEnvSetIds) {
                const envSet = environmentSets.find(s => s.id === setId);
                if (envSet) {
                    mergedEnvVars = { ...mergedEnvVars, ...envSet.variables };
                }
            }
            // Custom vars override all preset vars
            mergedEnvVars = { ...mergedEnvVars, ...customEnvVars };

            const result = await machineSpawnNewSession({
                machineId: selectedMachineId,
                directory: actualPath,
                // For now we assume you already have a path to start in
                approvedNewDirectoryCreation: true,
                agent: agentType,
                resumeClaudeSessionId: manualResumeSessionId || resumeClaudeSessionId,
                // Pass merged environment variables
                environmentVariables: Object.keys(mergedEnvVars).length > 0 ? mergedEnvVars : undefined,
            });

            // Use sessionId to check for success for backwards compatibility
            if ('sessionId' in result && result.sessionId) {
                // Store worktree metadata if applicable
                if (sessionType === 'worktree') {
                    // The metadata will be stored by the session itself once created
                }

                // Link task to session if task ID is provided
                if (tempSessionData?.taskId && tempSessionData?.taskTitle) {
                    const promptDisplayTitle = tempSessionData.prompt?.startsWith('Work on this task:')
                        ? `Work on: ${tempSessionData.taskTitle}`
                        : `Clarify: ${tempSessionData.taskTitle}`;
                    await linkTaskToSession(
                        tempSessionData.taskId,
                        result.sessionId,
                        tempSessionData.taskTitle,
                        promptDisplayTitle
                    );
                }

                // Load sessions
                await sync.refreshSessions();

                // Set permission and model modes on the session
                storage.getState().updateSessionPermissionMode(result.sessionId, permissionMode);
                storage.getState().updateSessionModelMode(result.sessionId, modelMode);

                // Send message (with or without images)
                const hasImages = imageAttachments.length > 0;
                if (hasImages) {
                    const currentImages = [...imageAttachments];
                    setUploadingImageIds(new Set(currentImages.map(img => img.id)));
                    clearImageAttachments();

                    const sendResult = await sync.sendMessageWithImages(
                        result.sessionId,
                        currentInput,
                        currentImages,
                        (imageId) => {
                            setUploadingImageIds(prev => {
                                const next = new Set(prev);
                                next.delete(imageId);
                                return next;
                            });
                        }
                    );

                    if (!sendResult.success && sendResult.errors.length > 0) {
                        Modal.alert(t('common.error'), sendResult.errors.join('\n'));
                    }

                    setUploadingImageIds(new Set());
                } else {
                    await sync.sendMessage(result.sessionId, currentInput);
                }

                // Navigate to session
                router.replace(`/session/${result.sessionId}`, {
                    dangerouslySingular() {
                        return 'session'
                    },
                });
            } else {
                throw new Error('Session spawning failed - no session ID returned.');
            }
        } catch (error) {
            console.error('Failed to start session', error);

            // Restore input on failure so user doesn't lose their work
            setInput(currentInput);

            let errorMessage = 'Failed to start session. Make sure the daemon is running on the target machine.';
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorMessage = 'Session startup timed out. The machine may be slow or the daemon may not be responding.';
                } else if (error.message.includes('Socket not connected')) {
                    errorMessage = 'Not connected to server. Check your internet connection.';
                }
            }

            Modal.alert(t('common.error'), errorMessage);
        } finally {
            setIsSending(false);
        }
    }, [isSending, agentType, selectedMachineId, selectedPath, input, recentMachinePaths, sessionType, permissionMode, modelMode, imageAttachments, clearImageAttachments, selectedEnvSetIds, customEnvVars, environmentSets]);

    // Keep doCreateRef updated for auto-send mode
    React.useEffect(() => {
        doCreateRef.current = doCreate;
    }, [doCreate]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
            style={{
                flex: 1,
                justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
                paddingTop: Platform.OS === 'web' ? 0 : 40,
                paddingBottom: safeArea.bottom,
            }}
        >
            <View style={{
                width: '100%',
                alignSelf: 'center',
            }}>
                {/* Session type selector */}
                <View style={[
                    { paddingHorizontal: screenWidth > 700 ? 16 : 8, flexDirection: 'row', justifyContent: 'center' }
                ]}>
                    <View style={[
                        { maxWidth, flex: 1 }
                    ]}>
                        <SessionTypeSelector
                            value={sessionType}
                            onChange={setSessionType}
                            worktreeName={worktreeName}
                            onWorktreeNameChange={setWorktreeName}
                        />
                    </View>
                </View>

                {/* Agent input */}
                <AgentInput
                    placeholder={t('session.inputPlaceholder')}
                    ref={ref}
                    value={input}
                    onChangeText={setInput}
                    onSend={doCreate}
                    isSending={isSending}
                    agentType={agentType}
                    onAgentClick={handleAgentClick}
                    machineName={selectedMachine?.metadata?.displayName || selectedMachine?.metadata?.host || null}
                    onMachineClick={handleMachineClick}
                    permissionMode={permissionMode}
                    onPermissionModeChange={handlePermissionModeChange}
                    modelMode={modelMode}
                    onModelModeChange={handleModelModeChange}
                    autocompletePrefixes={[]}
                    autocompleteSuggestions={async () => []}
                    // Image attachment props
                    imageAttachments={imageAttachments}
                    onRemoveImageAttachment={removeImageAttachment}
                    onPickImage={pickImage}
                    uploadingImageIds={uploadingImageIds}
                    onPaste={handlePaste}
                    // Selection tracking for cursor-aware transcription insertion
                    onSelectionChange={(selection) => { selectionRef.current = selection; }}
                    // Voice transcription props
                    onMicPress={micButtonState.onMicPress}
                    onMicLongPressStart={micButtonState.onMicLongPressStart}
                    onMicPressOut={micButtonState.onMicPressOut}
                    onCancelRecording={cancelRecording}
                    micStatus={micButtonState.micStatus}
                    onSendWhileRecording={handleSendWhileRecording}
                    // Allow more vertical space for composing new session prompts
                    maxHeight={300}
                />

                <View style={[
                    { paddingHorizontal: screenWidth > 700 ? 16 : 8, flexDirection: 'row', justifyContent: 'center' }
                ]}>
                    <View style={[
                        { maxWidth, flex: 1 }
                    ]}>
                        <Pressable
                            onPress={handlePathClick}
                            style={(p) => ({
                                backgroundColor: theme.colors.input.background,
                                borderRadius: Platform.select({ default: 16, android: 20 }),
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: p.pressed ? 0.7 : 1,
                            })}
                        >
                            <Ionicons
                                name="folder-outline"
                                size={14}
                                color={theme.colors.button.secondary.tint}
                            />
                            <Text style={{
                                fontSize: 13,
                                color: theme.colors.button.secondary.tint,
                                fontWeight: '600',
                                marginLeft: 6,
                                ...Typography.default('semiBold'),
                            }}>
                                {selectedPath}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Environment picker */}
                <View style={[
                    { paddingHorizontal: screenWidth > 700 ? 16 : 8, flexDirection: 'row', justifyContent: 'center' }
                ]}>
                    <View style={[
                        { maxWidth, flex: 1 }
                    ]}>
                        <Pressable
                            onPress={handleEnvironmentClick}
                            style={(p) => ({
                                backgroundColor: theme.colors.input.background,
                                borderRadius: Platform.select({ default: 16, android: 20 }),
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: p.pressed ? 0.7 : 1,
                            })}
                        >
                            <Ionicons
                                name="key-outline"
                                size={14}
                                color={selectedEnvSetIds.length > 0 || Object.keys(customEnvVars).length > 0 ? theme.colors.textLink : theme.colors.button.secondary.tint}
                            />
                            <Text style={{
                                fontSize: 13,
                                color: selectedEnvSetIds.length > 0 || Object.keys(customEnvVars).length > 0 ? theme.colors.textLink : theme.colors.button.secondary.tint,
                                fontWeight: '600',
                                marginLeft: 6,
                                ...Typography.default('semiBold'),
                            }}>
                                {selectedEnvDisplayName}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Resume session ID input - Claude only */}
                {agentType === 'claude' && (
                    <View style={[
                        { paddingHorizontal: screenWidth > 700 ? 16 : 8, flexDirection: 'row', justifyContent: 'center' }
                    ]}>
                        <View style={[
                            { maxWidth, flex: 1 }
                        ]}>
                            <View style={{
                                backgroundColor: theme.colors.input.background,
                                borderRadius: Platform.select({ default: 16, android: 20 }),
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Ionicons
                                    name="refresh-outline"
                                    size={14}
                                    color={manualResumeSessionId ? theme.colors.textLink : theme.colors.button.secondary.tint}
                                />
                                <TextInput
                                    value={manualResumeSessionId}
                                    onChangeText={setManualResumeSessionId}
                                    placeholder={t('newSession.resumeSessionPlaceholder')}
                                    placeholderTextColor={theme.colors.textSecondary}
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: theme.colors.text,
                                        marginLeft: 6,
                                        padding: 0,
                                        ...Typography.default('semiBold'),
                                    }}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {manualResumeSessionId.length > 0 && (
                                    <Pressable onPress={() => setManualResumeSessionId('')}>
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={theme.colors.textSecondary}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    )
}

export default React.memo(NewSessionScreen);
