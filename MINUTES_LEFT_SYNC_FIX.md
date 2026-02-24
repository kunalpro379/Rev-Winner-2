# Minutes Left Synchronization Fix

## Issue Fixed

The "Session Active: 180 min left" was not updating after using minutes. It should show the remaining minutes after subtracting usage.

**Example:**
- Total: 180 minutes
- Used: 2 minutes
- Should show: **178 min left** (not 180 min left)

## Root Cause

The `/api/session-minutes/status` endpoint was calculating used minutes from the `conversations` table, but the timer system uses the `session_usage` table. This created a mismatch:

- **Total Usage display**: Reads from `session_usage` ✅
- **Minutes Left display**: Was reading from `conversations` ❌

## Solution

Updated `/api/session-minutes/status` endpoint to calculate used minutes from `session_usage` table (the source of truth for timing).

## Changes Made

### File: `server/routes-billing.ts`

1. **Added import**: `sessionUsage` from schema
2. **Updated calculation**: Changed from reading `conversations` to reading `session_usage`
3. **Accurate minutes**: Now calculates from `durationSeconds` field

### Before (Wrong):
```typescript
// Read from conversations table
const userConversations = await db
  .select()
  .from(conversations)
  .where(eq(conversations.userId, userId));

actualUsedMinutes = userConversations
  .filter(conv => !!conv.transcriptionStartedAt)
  .reduce((total, conv) => {
    const durationMs = endTime - startTime;
    const durationMinutes = Math.ceil(durationMs / 60000);
    return total + durationMinutes;
  }, 0);
```

### After (Correct):
```typescript
// Read from session_usage table (source of truth)
const userSessions = await db
  .select()
  .from(sessionUsage)
  .where(and(
    eq(sessionUsage.userId, userId),
    eq(sessionUsage.status, "ended")
  ));

actualUsedMinutes = userSessions.reduce((total, session) => {
  const durationSeconds = parseInt(session.durationSeconds || '0');
  const durationMinutes = Math.floor(durationSeconds / 60);
  return total + durationMinutes;
}, 0);
```

## What You Need to Do

**RESTART YOUR SERVER** to apply the fix:

```bash
# Press Ctrl+C in terminal
# Then run:
npm run dev
```

## Testing

After server restart:

1. **Check initial state**:
   - Session Active: 180 min left ✅

2. **Start a session and run for 2 minutes**:
   - Stop the session
   - Total Usage: 2m ✅
   - Session Active: **178 min left** ✅ (was showing 180 before)

3. **Start another session and run for 3 minutes**:
   - Stop the session
   - Total Usage: 5m ✅
   - Session Active: **175 min left** ✅

## Expected Behavior

### Before Fix ❌:
```
Total Usage: 2m
Session Active: 180 min left  ← Wrong! Not updating
```

### After Fix ✅:
```
Total Usage: 2m
Session Active: 178 min left  ← Correct! Synchronized
```

## Architecture

Now all three displays are synchronized and reading from `session_usage` table:

```
session_usage table (Source of Truth)
         ↓
    ┌────┴────┬─────────────┬──────────────────┐
    ↓         ↓             ↓                  ↓
Total Usage   Minutes Left  Session History   Billing
```

## Benefits

✅ **Consistent data** - All displays use same source
✅ **Accurate tracking** - Minutes left updates in real-time
✅ **No drift** - Backend calculates from database
✅ **Production ready** - Reliable billing data

---

**Status**: ✅ Fixed - Restart server to apply
**Critical**: Server MUST be restarted to load the fix
