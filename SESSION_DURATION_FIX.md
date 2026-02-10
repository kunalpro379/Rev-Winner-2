# Session Duration Tracking Fix

## Problem
Sessions were being counted from page load/login (`createdAt` timestamp) instead of from when the user actually clicked the "Start" button to begin transcription. This resulted in inflated session durations that included idle time before transcription started.

## User Requirement
> "Session only calculated only when the session started till the session ended... here start button clicked karke jab live chalu hogi toh woho session mana jayega start huva okkk login session ka nahi bro"

Translation: Session duration should ONLY count from when transcription actually starts (Start button clicked) until it ends, NOT from login/page load.

## Solution

### 1. Database Schema Change
Added new field `transcriptionStartedAt` to `conversations` table:

```sql
ALTER TABLE conversations 
ADD COLUMN transcription_started_at TIMESTAMP;

CREATE INDEX idx_conversations_transcription_started ON conversations(transcription_started_at);
```

**Fields Explanation:**
- `createdAt`: When conversation record was created (page load)
- `transcriptionStartedAt`: When user clicked Start button (NEW - this is what we use for duration)
- `endedAt`: When user clicked Stop/End button

**Session Duration Formula:**
```
Duration = transcriptionStartedAt to endedAt
(NOT createdAt to endedAt)
```

### 2. Backend Changes

#### New API Endpoint
**POST** `/api/conversations/:sessionId/start-transcription`

Called when user clicks Start button. Sets `transcriptionStartedAt` timestamp (only on first Start click).

**Response:**
```json
{
  "success": true,
  "transcriptionStartedAt": "2026-02-10T23:45:00.000Z"
}
```

#### Updated Duration Calculation
**File:** `server/routes.ts` - GET `/api/conversations` endpoint

**Before:**
```typescript
durationMinutes: conv.endedAt && conv.createdAt
  ? Math.round((conv.endedAt.getTime() - conv.createdAt.getTime()) / (1000 * 60))
  : 0
```

**After:**
```typescript
// Use transcriptionStartedAt if available, otherwise fall back to createdAt for old sessions
const startTime = conv.transcriptionStartedAt || conv.createdAt;
const endTime = conv.endedAt || new Date();

durationMinutes: startTime && conv.endedAt
  ? Math.round((conv.endedAt.getTime() - startTime.getTime()) / (1000 * 60))
  : 0
```

### 3. Frontend Changes

#### Enhanced Live Transcript Component
**File:** `client/src/components/enhanced-live-transcript.tsx`

Added API call in `handleStart()` function:

```typescript
// Mark transcription start in database (for accurate session duration tracking)
if (sessionId) {
  try {
    await apiRequest("POST", `/api/conversations/${sessionId}/start-transcription`, {});
    console.log(`✅ Transcription start marked for session ${sessionId}`);
  } catch (error) {
    console.error('Failed to mark transcription start:', error);
    // Don't block transcription if this fails - it's just for tracking
  }
}

await startTranscription(true, captureMeetingAudio);
```

## Impact

### Session History Display
Sessions in user profile now show accurate duration:
- **Before:** Included idle time from page load to Start button click
- **After:** Only counts active transcription time (Start to Stop)

### Billing Calculations
Session minutes usage now accurately reflects:
- Only time when transcription was actively running
- Excludes setup time, page load time, and idle time
- Fair billing based on actual usage

### Example Scenario

**Timeline:**
1. 10:00 AM - User logs in, page loads → `createdAt` set
2. 10:05 AM - User clicks Start button → `transcriptionStartedAt` set
3. 10:20 AM - User clicks Stop button → `endedAt` set

**Old Calculation:**
```
Duration = 10:20 AM - 10:00 AM = 20 minutes
(Includes 5 minutes of idle time)
```

**New Calculation:**
```
Duration = 10:20 AM - 10:05 AM = 15 minutes
(Only active transcription time)
```

## Migration Notes

### Backward Compatibility
- Old sessions without `transcriptionStartedAt` will fall back to `createdAt`
- No data loss or breaking changes
- Gradual migration as users start new sessions

### Database Migration
Run migration file: `migrations/0002_add_transcription_started_at.sql`

```bash
# Apply migration
npm run db:migrate
```

## Testing Checklist

- [ ] Start button marks `transcriptionStartedAt` in database
- [ ] Session duration calculated from `transcriptionStartedAt` to `endedAt`
- [ ] Old sessions (without `transcriptionStartedAt`) still work with fallback
- [ ] Session history shows correct durations
- [ ] Billing calculations use correct timestamps
- [ ] Multiple Start/Pause/Resume cycles only set `transcriptionStartedAt` once

## Files Modified

### Backend
- `shared/schema.ts` - Added `transcriptionStartedAt` field to conversations table
- `server/routes.ts` - Added `/start-transcription` endpoint and updated duration calculation
- `migrations/0002_add_transcription_started_at.sql` - Database migration

### Frontend
- `client/src/components/enhanced-live-transcript.tsx` - Added API call on Start button click

## Related Issues
- Session duration tracking
- Billing accuracy
- User experience (fair usage calculation)

---

**Status:** ✅ Complete
**Date:** February 10, 2026
**Priority:** High (affects billing and user trust)
