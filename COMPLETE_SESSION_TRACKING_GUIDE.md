# Complete Session Tracking Guide - Rev Winner

## Overview
Rev Winner tracks your sales call sessions to calculate usage and manage your session minutes balance. This guide explains how the system works and what was fixed.

## How Session Tracking Works

### 1. Starting a Session
When you click "Start Session" in the Sales Assistant:
- A new entry is created in the `sessionUsage` database table
- Fields recorded:
  - `sessionId`: Unique identifier for this session
  - `userId`: Your user ID
  - `startTime`: Current timestamp when you started
  - `status`: Set to "active"
  - `endTime`: null (not ended yet)
  - `durationSeconds`: null (not calculated yet)

### 2. During the Session
- The frontend timer counts up showing elapsed time
- You can use all AI features (transcription, coaching, etc.)
- The session remains "active" in the database

### 3. Ending a Session
When you click "Stop Session" or close the browser:
- The session entry is updated with:
  - `endTime`: Current timestamp when you stopped
  - `durationSeconds`: Calculated as (endTime - startTime) in seconds
  - `status`: Changed to "ended"
- Your subscription is updated with:
  - `minutesUsed`: Incremented by the session duration
  - `sessionsUsed`: Incremented by 1

### 4. Viewing Session History
On your Profile page, you see:
- **Total Usage**: Sum of all session durations (hours and minutes)
- **Total Sessions**: Count of completed sessions
- **Minutes Remaining**: Your balance minus minutes used
- **Recent Sessions Table**: List of all completed sessions with:
  - Start time
  - End time
  - Duration
  - Summary (if available)

## What Was Fixed

### Problem
The profile page was showing incorrect or missing session data because:
1. Backend was querying the wrong database table (`conversations` instead of `sessionUsage`)
2. The `conversations` table doesn't have accurate session timing data
3. Duration calculations were incorrect

### Solution
Updated the `/api/profile/subscription` endpoint to:
1. ✅ Query the `sessionUsage` table for accurate session tracking
2. ✅ Filter only completed sessions (status = 'ended')
3. ✅ Use the stored `durationSeconds` for accurate duration
4. ✅ Join with `conversations` table to get call summaries
5. ✅ Return properly formatted session history

## Database Schema

### sessionUsage Table
```
- id: Primary key
- userId: User who owns this session
- sessionId: Unique session identifier
- startTime: When session started (timestamp)
- endTime: When session ended (timestamp, nullable)
- durationSeconds: Total duration in seconds (string, nullable)
- status: 'active' or 'ended'
- createdAt: Record creation time
```

### subscriptions Table
```
- id: Primary key
- userId: User who owns this subscription
- planType: 'free_trial', 'monthly', etc.
- status: 'active', 'trial', 'expired', etc.
- sessionsUsed: Total number of sessions started (string)
- sessionsLimit: Maximum sessions allowed (string, nullable)
- minutesUsed: Total minutes consumed (string)
- minutesLimit: Maximum minutes allowed (string, nullable)
- sessionHistory: JSON array of session summaries (deprecated, now using sessionUsage table)
```

## API Endpoints

### Start Session
```
POST /api/session-usage/start
Authorization: Bearer <token>

Response:
{
  "sessionUsage": {
    "id": "...",
    "sessionId": "usage_1234567890_abc123",
    "userId": "...",
    "startTime": "2026-02-09T10:28:00.000Z",
    "endTime": null,
    "durationSeconds": null,
    "status": "active"
  },
  "accessType": "subscription" | "enterprise_license" | "super_user"
}
```

### Stop Session
```
PUT /api/session-usage/:sessionId/stop
Authorization: Bearer <token>

Response:
{
  "sessionUsage": {
    "id": "...",
    "sessionId": "usage_1234567890_abc123",
    "userId": "...",
    "startTime": "2026-02-09T10:28:00.000Z",
    "endTime": "2026-02-09T10:30:00.000Z",
    "durationSeconds": "120",
    "status": "ended"
  }
}
```

### Get Session History
```
GET /api/profile/subscription
Authorization: Bearer <token>

Response:
{
  "id": "...",
  "planType": "free_trial",
  "status": "trial",
  "sessionsUsed": "2",
  "sessionsLimit": "3",
  "minutesUsed": "25",
  "minutesLimit": "180",
  "sessionHistory": [
    {
      "sessionId": "usage_1234567890_abc123",
      "startTime": "2026-02-09T10:28:00.000Z",
      "endTime": "2026-02-09T10:30:00.000Z",
      "durationMinutes": 2,
      "summary": "Call summary text..."
    }
  ]
}
```

## Testing Instructions

### Test 1: Start and Stop a Session
1. Log in to Rev Winner
2. Go to Sales Assistant page
3. Click "Start Session"
4. Wait 2-3 minutes (timer should be counting)
5. Click "Stop Session"
6. Go to Profile page
7. Verify session appears in "Session History & Usage"

### Test 2: Verify Duration Calculation
1. Note the start time when you begin a session
2. Note the end time when you stop the session
3. Calculate expected duration: (end - start) in minutes
4. Check Profile page - duration should match your calculation

### Test 3: Verify Minutes Balance
1. Check "Minutes Remaining" before starting a session
2. Start and run a session for X minutes
3. Stop the session
4. Check "Minutes Remaining" again
5. It should have decreased by X minutes

## Common Issues

### Issue: Sessions don't appear in history
**Cause**: Session is still active (not stopped)
**Solution**: Make sure to click "Stop Session" before checking profile

### Issue: Duration shows 0 minutes
**Cause**: Session was stopped immediately after starting
**Solution**: Let the session run for at least 1 minute before stopping

### Issue: Minutes used doesn't update
**Cause**: Browser cache or page not refreshed
**Solution**: Refresh the profile page or clear browser cache

### Issue: "Free Trial Expired" message
**Cause**: You've used all 3 free trial sessions (180 minutes total)
**Solution**: Purchase Platform Access and Session Minutes packages

## Free Trial Limits
- **Sessions**: 3 sessions maximum
- **Minutes per Session**: Up to 60 minutes each
- **Total Minutes**: 180 minutes (3 × 60)
- **Features**: All AI features included
- **No Credit Card**: Required to start trial

## After Free Trial
You must purchase:
1. **Platform Access**: $40-$499 (based on plan duration)
2. **Session Minutes**: $8 for 500 minutes (required separately)

Both are mandatory to continue using Rev Winner after your free trial.

## Support
If you encounter issues with session tracking:
1. Check browser console for errors (F12 → Console tab)
2. Verify you're logged in
3. Try logging out and back in
4. Contact support at support@revwinner.com with:
   - Your email address
   - Session ID (if available)
   - Screenshot of the issue
