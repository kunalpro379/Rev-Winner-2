# Session Tracking Test Guide

## How to Test the Session Tracking Fix

### Step 1: Start a Session
1. Log in to Rev Winner
2. Navigate to the Sales Assistant page
3. Click "Start Session" or "New Session"
4. The session timer should start counting

### Step 2: Let Session Run
1. Keep the session active for at least 2-3 minutes
2. You can optionally:
   - Enable microphone
   - Start transcription
   - Have a conversation
3. Watch the timer increment

### Step 3: Stop the Session
1. Click "Stop Session" or "End Session"
2. The session should be saved to the database
3. You should see a confirmation message

### Step 4: Check Profile Page
1. Navigate to Profile page (click your name/avatar)
2. Scroll to "Session History & Usage" section
3. Verify you see:
   - **Total Usage**: Shows total hours and minutes used
   - **Total Sessions**: Shows number of sessions (should increment by 1)
   - **Minutes Remaining**: Shows remaining minutes from your balance
   - **Recent Sessions Table**: Should show your session with:
     - Session number (#)
     - Start Time (accurate timestamp)
     - End Time (accurate timestamp)
     - Duration (should match how long you ran the session)
     - Summary (if you had a conversation)

### Expected Results
✅ Session appears in the history table
✅ Start time matches when you started the session
✅ End time matches when you stopped the session
✅ Duration is calculated correctly (end time - start time)
✅ Total usage increases by the session duration
✅ Minutes used increases by the session duration

### What Was Fixed
Before: Session history was empty or showed incorrect data because it was pulling from the wrong database table.

After: Session history now pulls from the `sessionUsage` table which accurately tracks:
- When you start a session (startTime)
- When you end a session (endTime)
- How long the session lasted (durationSeconds)
- Session status (active/ended)

### Troubleshooting
If sessions don't appear:
1. Make sure you clicked "Stop Session" (active sessions don't show in history)
2. Refresh the profile page
3. Check browser console for any errors
4. Verify you're logged in with the same account

### Database Tables Involved
- `sessionUsage`: Tracks session start/stop times and duration
- `conversations`: Stores conversation transcripts and summaries
- `subscriptions`: Tracks total minutes used and session limits
