# Web Notifications - Server-Side Implementation TODO

## Overview
The web app is now ready to receive session-ready notifications via WebSocket. The server needs to be modified to emit these events when the CLI indicates a session is ready.

## Current Flow (CLI → Mobile Push)
1. CLI detects session is ready (in `runCodex.ts` and `runClaude.ts`)
2. CLI calls `api.push().sendToAllDevices(title, body, { sessionId })`
3. This directly sends Expo push notifications to mobile devices
4. Web app gets nothing

## Required Changes

### 1. Add Session-Ready Ephemeral Event Type
**File**: `happy-server/sources/app/events/eventRouter.ts`

Add to the `EphemeralEvent` union type:
```typescript
export type EphemeralEvent = {
    type: 'activity';
    // ... existing
} | {
    type: 'machine-activity';
    // ... existing
} | {
    type: 'usage';
    // ... existing
} | {
    type: 'session-ready';
    sessionId: string;
    sessionName?: string;
};
```

Add builder function:
```typescript
export function buildSessionReadyEphemeral(sessionId: string, sessionName?: string): EphemeralPayload {
    return {
        type: 'session-ready',
        sessionId,
        sessionName
    };
}
```

### 2. Add Server Endpoint for Session Ready
**File**: `happy-server/sources/app/api/routes/` (new file or add to sessionRoutes)

Create a POST endpoint that the CLI can call when a session is ready:
```typescript
app.post('/v1/sessions/:sessionId/ready', {
    schema: {
        params: z.object({
            sessionId: z.string()
        }),
        body: z.object({
            sessionName: z.string().optional()
        })
    },
    preHandler: app.authenticate
}, async (request, reply) => {
    const userId = request.userId;
    const { sessionId } = request.params;
    const { sessionName } = request.body;

    // Verify session belongs to user
    const session = await db.session.findUnique({
        where: { id: sessionId, accountId: userId }
    });

    if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
    }

    // Emit session-ready ephemeral event to all user's web clients
    const sessionReady = buildSessionReadyEphemeral(sessionId, sessionName);
    eventRouter.emitEphemeral({
        userId,
        payload: sessionReady,
        recipientFilter: { type: 'user-scoped-only' } // Only web clients, not CLI
    });

    return reply.send({ success: true });
});
```

### 3. Update CLI to Call New Endpoint
**Files**:
- `happy-cli/src/codex/runCodex.ts` (line ~227)
- `happy-cli/src/claude/utils/permissionHandler.ts` (line ~219)
- `happy-cli/src/claude/claudeRemoteLauncher.ts` (line ~395)

After sending push notifications, also notify the server:

```typescript
const sendReady = () => {
    session.sendSessionEvent({ type: 'ready' });

    // Send push notifications to mobile devices
    try {
        const hostname = os.hostname();
        const notificationTitle = `(${hostname}) ${process.cwd()}`;
        api.push().sendToAllDevices(
            notificationTitle,
            'Codex is waiting for your command',
            { sessionId: session.sessionId }
        );
    } catch (pushError) {
        logger.debug('[Codex] Failed to send ready push', pushError);
    }

    // Notify server to send WebSocket event to web clients
    try {
        api.sessions.notifyReady(session.sessionId, notificationTitle);
    } catch (webError) {
        logger.debug('[Codex] Failed to notify server for web notifications', webError);
    }
};
```

Add method to API client:
```typescript
// In happy-cli/src/api/sessions.ts or similar
async notifyReady(sessionId: string, sessionName?: string): Promise<void> {
    await this.request('POST', `/v1/sessions/${sessionId}/ready`, {
        body: { sessionName }
    });
}
```

## Alternative Approach (Server-Side Detection)
Instead of having the CLI notify the server, the server could track session state transitions itself:

**File**: `happy-server/sources/app/api/socket/sessionUpdateHandler.ts`

In the `session-alive` handler (line ~139-183), track previous thinking state and detect transitions:

```typescript
// Add state tracking map at module level
const sessionThinkingStates = new Map<string, boolean>();

socket.on('session-alive', async (data) => {
    // ... existing code ...

    const { sid, thinking } = data;
    const previousThinking = sessionThinkingStates.get(sid);

    // Detect transition from thinking to idle (ready)
    if (previousThinking === true && thinking === false) {
        // Session just became ready!
        const session = await db.session.findUnique({
            where: { id: sid, accountId: userId }
        });

        if (session) {
            const sessionName = // extract from session metadata
            const sessionReady = buildSessionReadyEphemeral(sid, sessionName);
            eventRouter.emitEphemeral({
                userId,
                payload: sessionReady,
                recipientFilter: { type: 'user-scoped-only' }
            });
        }
    }

    // Update tracked state
    sessionThinkingStates.set(sid, thinking || false);

    // ... rest of existing code ...
});
```

## Testing

1. Enable web notifications in the web app settings
2. Start a coding session (CLI or Codex)
3. Wait for the session to become idle/ready
4. Switch to another browser tab
5. Verify notification appears when session is ready
6. Click notification to verify it navigates to the session

## Web App Changes (Already Completed)
✅ Added `ApiEphemeralSessionReadySchema` to `sources/sync/apiTypes.ts`
✅ Added handler in `sources/sync/sync.ts` to show notification
✅ Created `WebNotificationManager` in `sources/utils/webNotifications.ts`
✅ Added settings UI toggle in `sources/app/(app)/settings/features.tsx`
✅ Added `webNotificationsEnabled` to local settings
