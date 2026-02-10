# Quick Action Guide - What You Need to Do

## 🚨 IMMEDIATE ACTION REQUIRED

### 1. Restart Your Server

**Stop the server:**
```bash
Ctrl+C
```

**Start the server:**
```bash
npm run dev
```

**Why?** All code fixes require server restart to take effect.

---

## 2. Test Query Pitches

### Steps:
1. Go to Call Session page
2. Click "Start" button
3. Have a conversation with customer questions like:
   - "How much does it cost?"
   - "What features do you have?"
   - "Can it integrate with Salesforce?"
4. Look at "Customer Query Pitches" section
5. Should now show detected queries with responses

### Expected Result:
- Queries detected and displayed
- No more "No customer queries detected yet"
- Server logs show: `Customer Query Pitches Response: { queriesCount: 2, ... }`

---

## 3. Test Mind Map

### Steps:
1. Start a session with good conversation (200+ words)
2. Click "Map/Flow" button
3. Wait up to 60 seconds

### Expected Result:
- Mind map generates successfully
- Shows nodes and edges
- No timeout error

---

## 4. Test Session Timer

### Steps:
1. Go to Call Session page
2. Look at "Current Session" timer (should show 00:00:00)
3. Click "Start" button
4. Allow microphone access
5. Start speaking

### Expected Result:
- Timer starts counting: 00:00:01, 00:00:02, 00:00:03...
- Timer shows in purple/primary color when running
- When you click "Stop", timer resets to 00:00:00
- "Total Usage" updates with session time

### Why It Was Showing 00:00:00:
- Timer only runs when transcription is active
- You need to click "Start" button first
- Timer counts from Start button click to Stop button click
- It's working correctly - just needs an active session

---

## 5. Verify Session Count Consistency

### Steps:
1. Go to Profile → Subscription
2. Look at "Usage Summary" (e.g., "4 sessions, 16 minutes")
3. Look at "Recent Sessions" table
4. Count the sessions and minutes

### Expected Result:
- Numbers match between summary and table
- Only shows sessions where you actually used transcription
- No 1-minute page-load sessions

---

## What Was Fixed

### ✅ Query Pitches
- **Problem**: JSON responses were truncated, causing empty results
- **Fix**: Increased max_tokens from 500 to 1500
- **Impact**: Complete responses, proper query detection

### ✅ Mind Map
- **Problem**: Timing out after 45 seconds
- **Fix**: Increased timeout to 60 seconds
- **Impact**: More time for complex conversations

### ✅ Session Timer
- **Problem**: Showing 00:00:00
- **Fix**: No fix needed - it's working correctly!
- **Explanation**: Timer only runs during active transcription
- **Action**: Click "Start" button to see it work

### ✅ Session Count (Already Fixed)
- **Problem**: Inconsistent numbers between summary and table
- **Fix**: Calculate from same filtered data
- **Impact**: Consistent display everywhere

---

## If You Still See Issues

### Query Pitches Empty
1. Check server logs for errors
2. Make sure conversation has actual questions
3. Let me know what the logs say

### Mind Map Timeout
1. Check how long your transcript is
2. Try with shorter conversation first
3. Check server logs for timing

### Session Timer 00:00:00
1. Did you click "Start" button?
2. Did you allow microphone access?
3. Check browser console for errors
4. The timer ONLY runs when transcription is active

---

## Summary

**What you need to do:**
1. ✅ Restart server (CRITICAL)
2. ✅ Test Query Pitches
3. ✅ Test Mind Map
4. ✅ Test Session Timer (click Start button!)
5. ✅ Verify session counts

**What's fixed:**
- Query Pitches: max_tokens 500 → 1500
- Mind Map: timeout 45s → 60s
- Session Timer: Working correctly (just click Start!)
- Session Count: Already consistent

**Server restart required for fixes to work!**
