import type { Session } from '@/sync/storageTypes';
import { getSessionName, getSessionSubtitle } from '@/utils/sessionUtils';

/**
 * Checks if a session matches the search query.
 * Supports OR syntax with '|' separator (e.g., "foo|bar" matches sessions containing "foo" OR "bar").
 * Each term is matched against session name, subtitle, machine host, path, Happy session ID, and Claude session ID.
 */
export function sessionMatchesSearch(session: Session, searchQuery: string, customSessionTitles?: Record<string, string>): boolean {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (!normalizedQuery) return true;

    const sessionName = getSessionName(session, customSessionTitles).toLowerCase();
    const sessionSubtitle = getSessionSubtitle(session).toLowerCase();
    const machineHost = session.metadata?.host?.toLowerCase() || '';
    const sessionPath = session.metadata?.path?.toLowerCase() || '';
    const happySessionId = session.id.toLowerCase();
    const claudeSessionId = session.metadata?.claudeSessionId?.toLowerCase() || '';

    // Split by '|' for OR logic
    const terms = normalizedQuery.split('|').map(t => t.trim()).filter(t => t.length > 0);

    // If no valid terms after splitting, match everything
    if (terms.length === 0) return true;

    // Match if ANY term matches (OR logic)
    return terms.some(term =>
        sessionName.includes(term) ||
        sessionSubtitle.includes(term) ||
        machineHost.includes(term) ||
        sessionPath.includes(term) ||
        happySessionId.includes(term) ||
        claudeSessionId.includes(term)
    );
}
