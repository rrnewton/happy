import { Platform } from 'react-native';
import { storage } from './storage';
import { encodeBase64 } from '@/encryption/base64';

//
// Types for Wakapi API responses
//

export interface WakapiStatsItem {
    name: string;
    total_seconds: number;
    percent: number;
    digital: string;
    text: string;
    hours: number;
    minutes: number;
    seconds?: number;
}

export interface WakapiStats {
    username: string;
    user_id: string;
    start: string;
    end: string;
    status: string;
    total_seconds: number;
    daily_average: number;
    days_including_holidays: number;
    range: string;
    human_readable_range: string;
    human_readable_total: string;
    human_readable_daily_average: string;
    editors: WakapiStatsItem[];
    languages: WakapiStatsItem[];
    machines: WakapiStatsItem[];
    projects: WakapiStatsItem[];
    operating_systems: WakapiStatsItem[];
    categories?: WakapiStatsItem[];
}

export interface WakapiStatsResponse {
    data: WakapiStats;
}

export type WakapiRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_6_months' | 'last_year' | 'all_time';

//
// Configuration helpers
//

export interface WakapiConfig {
    apiUrl: string;
    apiKey: string;
    proxyEnabled: boolean;
    proxyUrl: string | null;
}

/**
 * Get Wakapi configuration from settings
 * Returns null if Wakapi is not configured
 */
export function getWakapiConfig(): WakapiConfig | null {
    const settings = storage.getState().settings;

    if (!settings.wakapiEnabled || !settings.wakapiApiUrl || !settings.wakapiApiKey) {
        return null;
    }

    return {
        apiUrl: settings.wakapiApiUrl,
        apiKey: settings.wakapiApiKey,
        proxyEnabled: settings.wakapiProxyEnabled,
        proxyUrl: settings.wakapiProxyUrl,
    };
}

/**
 * Check if we need to use the CORS proxy
 * Web platform needs proxy, native platforms don't
 */
function needsProxy(config: WakapiConfig): boolean {
    if (Platform.OS !== 'web') {
        return false;
    }
    return config.proxyEnabled && !!config.proxyUrl;
}

/**
 * Build the Authorization header for Wakapi
 * Wakapi uses HTTP Basic Auth with the API key
 */
function buildAuthHeader(apiKey: string): string {
    // Wakapi expects the API key to be base64 encoded
    const encoded = encodeBase64(new TextEncoder().encode(apiKey));
    return `Basic ${encoded}`;
}

/**
 * Build the request URL, using proxy if needed
 */
function buildRequestUrl(config: WakapiConfig, endpoint: string): string {
    const baseUrl = config.apiUrl.replace(/\/$/, '');

    if (needsProxy(config) && config.proxyUrl) {
        // Use proxy: /proxy/{endpoint} with X-Wakapi-URL header
        const proxyBase = config.proxyUrl.replace(/\/$/, '');
        return `${proxyBase}/proxy/${endpoint}`;
    }

    return `${baseUrl}/${endpoint}`;
}

/**
 * Build request headers, including proxy headers if needed
 */
function buildHeaders(config: WakapiConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'Authorization': buildAuthHeader(config.apiKey),
        'Content-Type': 'application/json',
    };

    if (needsProxy(config)) {
        headers['X-Wakapi-URL'] = config.apiUrl;
    }

    return headers;
}

//
// API Functions
//

/**
 * Fetch coding stats for a given time range
 */
export async function fetchWakapiStats(range: WakapiRange = 'last_7_days'): Promise<WakapiStats> {
    const config = getWakapiConfig();
    if (!config) {
        throw new Error('Wakapi is not configured');
    }

    const url = buildRequestUrl(config, `v1/users/current/stats/${range}`);
    const headers = buildHeaders(config);

    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid Wakapi API key');
        }
        if (response.status === 404) {
            throw new Error('Wakapi user not found');
        }
        throw new Error(`Wakapi API error: ${response.status}`);
    }

    const data = await response.json() as WakapiStatsResponse;
    return data.data;
}

/**
 * Verify Wakapi connection with given credentials
 * Used to test settings before saving
 */
export async function verifyWakapiConnection(
    apiUrl: string,
    apiKey: string,
    proxyEnabled: boolean,
    proxyUrl: string | null
): Promise<{ success: true; username: string } | { success: false; error: string }> {
    const config: WakapiConfig = {
        apiUrl,
        apiKey,
        proxyEnabled,
        proxyUrl,
    };

    try {
        const url = buildRequestUrl(config, 'v1/users/current/stats/today');
        const headers = buildHeaders(config);

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: 'Invalid API key' };
            }
            if (response.status === 404) {
                return { success: false, error: 'User not found' };
            }
            return { success: false, error: `API error: ${response.status}` };
        }

        const data = await response.json() as WakapiStatsResponse;
        return { success: true, username: data.data.username };
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return { success: false, error: 'Network error - check URL and proxy settings' };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Get all-time coding stats
 */
export async function fetchWakapiAllTime(): Promise<{ total_seconds: number; text: string }> {
    const config = getWakapiConfig();
    if (!config) {
        throw new Error('Wakapi is not configured');
    }

    const url = buildRequestUrl(config, 'v1/users/current/all_time_since_today');
    const headers = buildHeaders(config);

    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw new Error(`Wakapi API error: ${response.status}`);
    }

    const data = await response.json() as { data: { total_seconds: number; text: string } };
    return data.data;
}

//
// Heartbeat Types and Functions
//

export type HeartbeatType = 'file' | 'app' | 'domain';
export type HeartbeatCategory = 'coding' | 'building' | 'indexing' | 'debugging' | 'browsing' | 'running tests' | 'writing tests' | 'manual testing' | 'writing docs' | 'code reviewing' | 'researching' | 'learning' | 'designing';

export interface WakapiHeartbeat {
    entity: string;           // File path, app name, or domain
    type: HeartbeatType;      // 'file', 'app', or 'domain'
    time: number;             // UNIX epoch timestamp (seconds with decimals)
    project?: string;         // Project name
    branch?: string;          // Git branch
    language?: string;        // Programming language
    editor?: string;          // Editor name
    category?: HeartbeatCategory;
    is_write?: boolean;       // Whether triggered by file write
    lines?: number;           // Total lines in file
    lineno?: number;          // Current cursor line
    cursorpos?: number;       // Cursor column position
    machine?: string;         // Machine hostname
}

/**
 * Send a single heartbeat to Wakapi
 * Call this when user is actively using a session
 */
export async function sendHeartbeat(heartbeat: WakapiHeartbeat): Promise<boolean> {
    const config = getWakapiConfig();
    if (!config) {
        return false;
    }

    try {
        const url = buildRequestUrl(config, 'v1/users/current/heartbeats');
        const headers = buildHeaders(config);

        // Add user agent to help Wakapi identify the editor
        headers['User-Agent'] = 'Happy/1.0 happy-wakatime';

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(heartbeat),
        });

        return response.ok;
    } catch (error) {
        console.warn('Failed to send heartbeat:', error);
        return false;
    }
}

/**
 * Send multiple heartbeats in bulk (max 25 per request)
 */
export async function sendHeartbeatsBulk(heartbeats: WakapiHeartbeat[]): Promise<boolean> {
    const config = getWakapiConfig();
    if (!config) {
        return false;
    }

    if (heartbeats.length === 0) {
        return true;
    }

    // Limit to 25 heartbeats per request
    const batch = heartbeats.slice(0, 25);

    try {
        const url = buildRequestUrl(config, 'v1/users/current/heartbeats.bulk');
        const headers = buildHeaders(config);

        // Add user agent to help Wakapi identify the editor
        headers['User-Agent'] = 'Happy/1.0 happy-wakatime';

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(batch),
        });

        return response.ok;
    } catch (error) {
        console.warn('Failed to send bulk heartbeats:', error);
        return false;
    }
}

/**
 * Map session flavor to a display name for the language field.
 * The "language" tracks which AI agent/CLI is being used.
 */
function flavorToLanguage(flavor?: string): string {
    switch (flavor) {
        case 'codex': return 'Codex';
        case 'gpt':
        case 'openai': return 'Codex';
        case 'gemini': return 'Gemini';
        case 'claude':
        default: return 'Claude';
    }
}

/**
 * Create a heartbeat for a Happy session
 */
export function createSessionHeartbeat(
    sessionPath: string,
    projectName: string,
    machineName?: string,
    flavor?: string,
): WakapiHeartbeat {
    const heartbeat: WakapiHeartbeat = {
        entity: sessionPath,
        type: 'app',
        time: Date.now() / 1000, // Convert to seconds with decimals
        project: projectName,
        category: 'coding',
        language: flavorToLanguage(flavor),
        editor: 'Happy',
    };

    // Add machine name if available (helps distinguish between devices)
    if (machineName) {
        heartbeat.machine = machineName;
    }

    return heartbeat;
}
