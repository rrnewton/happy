import * as z from 'zod';

//
// Schema
//

// Environment variable set schema
const EnvironmentSetSchema = z.object({
    id: z.string(),
    name: z.string(),
    variables: z.record(z.string(), z.string()),
    isDefault: z.boolean().optional(),
});

export type EnvironmentSet = z.infer<typeof EnvironmentSetSchema>;

export const SettingsSchema = z.object({
    viewInline: z.boolean().describe('Whether to view inline tool calls'),
    inferenceOpenAIKey: z.string().nullish().describe('OpenAI API key for inference'),
    expandTodos: z.boolean().describe('Whether to expand todo lists'),
    showLineNumbers: z.boolean().describe('Whether to show line numbers in diffs'),
    showLineNumbersInToolViews: z.boolean().describe('Whether to show line numbers in tool view diffs'),
    wrapLinesInDiffs: z.boolean().describe('Whether to wrap long lines in diff views'),
    analyticsOptOut: z.boolean().describe('Whether to opt out of anonymous analytics'),
    experiments: z.boolean().describe('Whether to enable experimental features'),
    alwaysShowContextSize: z.boolean().describe('Always show context size in agent input'),
    avatarStyle: z.string().describe('Avatar display style'),
    showFlavorIcons: z.boolean().describe('Whether to show AI provider icons in avatars'),
    compactSessionView: z.boolean().describe('Whether to use compact view for active sessions'),
    hideInactiveSessions: z.boolean().describe('Hide inactive sessions in the main list'),
    reviewPromptAnswered: z.boolean().describe('Whether the review prompt has been answered'),
    reviewPromptLikedApp: z.boolean().nullish().describe('Whether user liked the app when asked'),
    voiceAssistantLanguage: z.string().nullable().describe('Preferred language for voice assistant (null for auto-detect)'),
    preferredLanguage: z.string().nullable().describe('Preferred UI language (null for auto-detect from device locale)'),
    recentMachinePaths: z.array(z.object({
        machineId: z.string(),
        path: z.string(),
        // null = user explicitly selected "None", undefined = use default, string = specific set
        envSetId: z.string().nullish(),
        customEnvVars: z.record(z.string(), z.string()).optional(),
    })).describe('Last 10 machine-path combinations with environment settings'),
    lastUsedAgent: z.string().nullable().describe('Last selected agent type for new sessions'),
    lastUsedPermissionMode: z.string().nullable().describe('Last selected permission mode for new sessions'),
    lastUsedModelMode: z.string().nullable().describe('Last selected model mode for new sessions'),
    // OpenAI voice transcription configuration
    openaiApiKey: z.string().nullable().describe('OpenAI API key for Whisper voice transcription'),
    whisperVocabulary: z.string().nullable().describe('Custom vocabulary for Whisper transcription (comma or newline separated words/phrases)'),
    // Custom system prompt appended to all messages
    customSystemPrompt: z.string().nullable().describe('Custom system prompt appended to all messages sent to the AI'),
    // Session read tracking - keyed by sessionId, value is timestamp when last viewed
    // Used for unread indicators, synced across devices
    sessionLastReadAt: z.record(z.string(), z.number()).describe('Last read timestamp per session for unread indicators'),
    // Environment variable sets for session configuration
    environmentSets: z.array(EnvironmentSetSchema).describe('Named sets of environment variables for sessions'),
});

//
// NOTE: Settings must be a flat object with no to minimal nesting, one field == one setting,
// you can name them with a prefix if you want to group them, but don't nest them.
// You can nest if value is a single value (like image with url and width and height)
// Settings are always merged with defaults and field by field.
// 
// This structure must be forward and backward compatible. Meaning that some versions of the app
// could be missing some fields or have a new fields. Everything must be preserved and client must 
// only touch the fields it knows about.
//

const SettingsSchemaPartial = SettingsSchema.loose().partial();

export type Settings = z.infer<typeof SettingsSchema>;

//
// Defaults
//

export const settingsDefaults: Settings = {
    viewInline: false,
    inferenceOpenAIKey: null,
    expandTodos: true,
    showLineNumbers: true,
    showLineNumbersInToolViews: false,
    wrapLinesInDiffs: false,
    analyticsOptOut: false,
    experiments: false,
    alwaysShowContextSize: false,
    avatarStyle: 'brutalist',
    showFlavorIcons: false,
    compactSessionView: false,
    hideInactiveSessions: false,
    reviewPromptAnswered: false,
    reviewPromptLikedApp: null,
    voiceAssistantLanguage: 'en-US',
    preferredLanguage: null,
    recentMachinePaths: [],
    lastUsedAgent: null,
    lastUsedPermissionMode: null,
    lastUsedModelMode: null,
    openaiApiKey: null,
    whisperVocabulary: null,
    customSystemPrompt: null,
    sessionLastReadAt: {},
    environmentSets: [],
};
Object.freeze(settingsDefaults);

//
// Resolving
//

export function settingsParse(settings: unknown): Settings {
    const parsed = SettingsSchemaPartial.safeParse(settings);
    if (!parsed.success) {
        return { ...settingsDefaults };
    }
    
    // Migration: Convert old 'zh' language code to 'zh-Hans'
    if (parsed.data.preferredLanguage === 'zh') {
        console.log('[Settings Migration] Converting language code from "zh" to "zh-Hans"');
        parsed.data.preferredLanguage = 'zh-Hans';
    }
    
    return { ...settingsDefaults, ...parsed.data };
}

//
// Applying changes
// NOTE: May be something more sophisticated here around defaults and merging, but for now this is fine.
//

export function applySettings(settings: Settings, delta: Partial<Settings>): Settings {
    return { ...settingsDefaults, ...settings, ...delta };
}
