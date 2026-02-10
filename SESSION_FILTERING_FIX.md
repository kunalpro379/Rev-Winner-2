# Session Filtering Fix - Complete

## Problem
Session history was showing 1-minute sessions that were just page loads without any actual transcription usage.

**Root Cause Discovered:**
- Sessions were created on page load with `created_at` timestamp
- User never clicked Start button, so `transcription_started_at` stayed NULL
- When user closed the page or navigated away, `ended_at` was set to current time (hours later)
- This made duration calculation show 5+ minutes, 8+ minutes, even 1896 minutes!
- Previous filter only hid sessions with `NULL transcriptionStartedAt AND duration < 2 minutes`
- Since these had duration > 2 minutes (due to late `ended_at`), they passed the filter

**Example from database:**
```
Session created: 2026-02-09 11:05:04
Transcription started: NULL ❌
Ended: 2026-02-10 19:15:35
Calculated duration: 1931 minutes (32+ hours!)
Previous filter result: SHOW (because duration > 2 minutes)
```

## Solution Applied

Changed filter logic from:
```typescript
// OLD: Only filter if BOTH conditions true
if (!session.transcriptionStarted && session.durationMinutes < 2) {
  return false;
}
```

To:
```typescript
// NEW: Filter ALL sessions without transcription start
return session.transcriptionStarted;
```

## Changes Made

### 1. `/api/conversations` endpoint (line ~297-304)
**Purpose:** User conversations list
**Change:** Only show sessions where `transcriptionStartedAt` is NOT NULL

### 2. `/api/profile/subscription` endpoint (line ~2210-2217)
**Purpose:** Session history on profile page
**Change:** Only show sessions where `transcriptionStartedAt` is NOT NULL

### 3. Admin analytics endpoint (line ~2365-2372)
**Purpose:** Admin session history and analytics
**Change:** Only show sessions where `transcriptionStartedAt` is NOT NULL

## Impact

**Before:**
- Showing 13 sessions for user
- 10 of them had NULL `transcription_started_at` (never clicked Start)
- These were just page loads, not actual usage

**After:**
- Only showing 3 sessions (the ones where user actually clicked Start)
- Accurate representation of AI feature usage
- No more "1 min wale sessions" clutter

## Testing

Run debug script to verify:
```bash
node debug-1min-sessions.mjs
```

Expected output:
- Sessions with `transcription_started_at = NULL` should show "Should Filter: ✅ YES"
- Only sessions with actual transcription start time will appear in UI

## Files Modified
- `server/routes.ts` (3 endpoints updated)
- `debug-1min-sessions.mjs` (debug script created)

## Status
✅ **COMPLETE** - All session history endpoints now strictly filter to show only actual transcription usage
