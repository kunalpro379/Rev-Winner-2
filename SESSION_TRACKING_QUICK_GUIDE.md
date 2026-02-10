# Session Duration Tracking - Quick Guide

## What Changed? 🎯

**Before:** Sessions counted from page load (login time)
**After:** Sessions count ONLY from Start button click to Stop button click

## How It Works Now ⚡

### User Flow
1. User logs in → Page loads → Conversation created with `createdAt` ✅
2. User clicks **Start** button → `transcriptionStartedAt` set ✅ (THIS IS THE SESSION START)
3. User talks, AI transcribes...
4. User clicks **Stop** button → `endedAt` set ✅ (THIS IS THE SESSION END)

### Duration Calculation
```
Session Duration = transcriptionStartedAt to endedAt
(NOT createdAt to endedAt)
```

## Example 📊

### Scenario
- 10:00 AM - Login, page loads
- 10:05 AM - Click Start button (5 minutes of setup/idle time)
- 10:20 AM - Click Stop button

### Old Calculation ❌
```
Duration = 10:20 AM - 10:00 AM = 20 minutes
(Includes 5 minutes of idle time - WRONG!)
```

### New Calculation ✅
```
Duration = 10:20 AM - 10:05 AM = 15 minutes
(Only active transcription time - CORRECT!)
```

## Where This Applies 📍

Session duration is now accurate in:
- ✅ Session History (Profile page)
- ✅ Billing calculations
- ✅ Meeting Minutes duration
- ✅ Usage reports
- ✅ Session backups

## Technical Details 🔧

### Database Field
- **Field Name:** `transcription_started_at`
- **Type:** TIMESTAMP
- **Set When:** User clicks Start button (first time only)
- **Used For:** Calculating actual session duration

### API Endpoint
- **Endpoint:** `POST /api/conversations/:sessionId/start-transcription`
- **Called By:** Start button in frontend
- **Purpose:** Mark when transcription actually begins

### Backward Compatibility
Old sessions without `transcriptionStartedAt` automatically fall back to `createdAt`:
```typescript
const startTime = conv.transcriptionStartedAt || conv.createdAt;
```

## Testing 🧪

### How to Verify It's Working

1. **Start a new session:**
   - Login to Rev Winner
   - Click Start button
   - Check browser console for: `✅ Transcription start marked for session...`

2. **Check session history:**
   - Go to Profile page
   - Look at session duration
   - Should only count time from Start to Stop

3. **Database check (for admins):**
   ```sql
   SELECT 
     session_id,
     created_at,
     transcription_started_at,
     ended_at,
     EXTRACT(EPOCH FROM (ended_at - transcription_started_at))/60 as duration_minutes
   FROM conversations 
   WHERE transcription_started_at IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Benefits 🎉

1. **Fair Billing** - Users only charged for actual usage
2. **Accurate Reports** - Session statistics reflect real activity
3. **User Trust** - Transparent, accurate time tracking
4. **Better Analytics** - Know actual transcription time vs idle time

## Migration 🚀

### For Existing Users
- Old sessions: Use `createdAt` (no change)
- New sessions: Use `transcriptionStartedAt` (accurate)
- Gradual migration as users start new sessions

### For Admins
1. Run database migration:
   ```bash
   npm run db:migrate
   ```

2. Deploy code changes:
   ```bash
   npm run build
   npm run deploy
   ```

3. Monitor logs for:
   ```
   ✅ Transcription start marked for session {id}
   🎤 Transcription started for session {id} at {time}
   ```

## FAQ ❓

**Q: What happens if Start button is clicked multiple times?**
A: `transcriptionStartedAt` is only set on the FIRST Start click. Subsequent clicks don't change it.

**Q: What about Pause/Resume?**
A: Duration still counts from first Start to final Stop. Pause time is included (this is intentional - session is still "active").

**Q: What if the API call fails?**
A: Transcription continues normally. The tracking is non-blocking. Falls back to `createdAt` if needed.

**Q: How does this affect billing?**
A: Users are now billed for actual transcription time only, not idle time. This is FAIRER for users.

**Q: Can I see the difference in my session history?**
A: Yes! New sessions will show shorter, more accurate durations. Old sessions remain unchanged.

---

**Status:** ✅ Implemented and Ready
**Impact:** High (improves billing accuracy and user trust)
**User Benefit:** Fair, transparent session tracking
