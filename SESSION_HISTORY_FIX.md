# Session History Display Fix

## Problem
The profile page was showing incorrect or missing session history data. The issue was that the backend was fetching session data from the `conversations` table instead of the `sessionUsage` table, which contains the accurate session tracking information.

## Root Cause
1. The `/api/profile/subscription` endpoint was querying the `conversations` table for session history
2. The `conversations` table doesn't have accurate start/end times for sessions
3. The actual session tracking happens in the `sessionUsage` table with proper `startTime`, `endTime`, and `durationSeconds` fields
4. Session timer is started when user clicks "Start Session" and stopped when they end the session

## Solution
Modified the `/api/profile/subscription` endpoint in `server/routes.ts` to:
1. Query the `sessionUsage` table instead of `conversations` table for accurate session tracking
2. Filter only completed sessions (status === 'ended' and endTime exists)
3. Calculate duration from the stored `durationSeconds` field
4. Join with `conversations` table to get call summaries for each session
5. Return properly formatted session history with accurate start times, end times, and durations

## Changes Made
- **File**: `server/routes.ts`
- **Endpoint**: `GET /api/profile/subscription`
- **Change**: Updated session history query to use `sessionUsage` table instead of `conversations` table

## How Session Tracking Works
1. User starts a sales call session → `POST /api/session-usage/start` creates entry in `sessionUsage` table
2. Timer runs in the frontend tracking elapsed time
3. User ends session → `PUT /api/session-usage/:sessionId/stop` updates the entry with:
   - `endTime`: Current timestamp
   - `durationSeconds`: Calculated from start to end time
   - `status`: Changed to "ended"
4. Profile page displays all completed sessions from `sessionUsage` table

## Testing
1. Start a new session from the Sales Assistant page
2. Let it run for a few minutes
3. Stop the session
4. Navigate to Profile page
5. Verify the session appears in "Session History & Usage" with correct:
   - Start time
   - End time
   - Duration (in minutes)
   - Summary (if available)

## Impact
- ✅ Session history now shows accurate data from actual session tracking
- ✅ Duration calculations are precise (based on actual start/stop times)
- ✅ Only completed sessions are displayed (no incomplete/active sessions)
- ✅ Session summaries are properly linked from conversations table
- ✅ Minutes used calculation is accurate for billing purposes
