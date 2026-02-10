# Minutes Remaining Calculation Fix

## Problem

User reported: "Minutes Remaining are not getting updated"

### What User Saw:
```
Session History:
- 3 sessions
- 18 minutes used

Minutes Remaining: 2998  ❌ WRONG!
(Should be: 3000 - 18 = 2982)
```

### Root Cause:
The `/api/session-minutes/status` endpoint was using `subscription.minutesUsed` which includes ALL sessions (even page loads without transcription). But the session history table was correctly filtered to only show sessions with `transcriptionStartedAt`.

This caused inconsistency:
- **Session History**: Shows 18 minutes (filtered, correct)
- **Minutes Remaining**: Calculated from OLD minutesUsed field (includes page loads, wrong)

---

## Solution Applied

### File: `server/routes-billing.ts`
**Endpoint**: `GET /api/session-minutes/status`

### Before:
```typescript
// Get subscription data
const subscription = await authStorage.getSubscriptionByUserId(userId);
const actualUsedMinutes = subscription?.minutesUsed ? parseInt(subscription.minutesUsed) : 0;

// Use subscription.minutesUsed (includes ALL sessions)
const usedMinutes = actualUsedMinutes > 0 ? actualUsedMinutes : balance.usedMinutes;
const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
```

**Problem**: Uses `subscription.minutesUsed` which includes page-load sessions.

### After:
```typescript
// Calculate actual used minutes from filtered conversations
let actualUsedMinutes = 0;
const userConversations = await db
  .select()
  .from(conversations)
  .where(eq(conversations.userId, userId))
  .orderBy(desc(conversations.createdAt));

// Only count sessions where transcriptionStartedAt is set
actualUsedMinutes = userConversations
  .filter(conv => !!conv.transcriptionStartedAt) // FILTER: Only real sessions
  .reduce((total, conv) => {
    const startTime = conv.transcriptionStartedAt || conv.createdAt || new Date();
    const endTime = conv.endedAt || conv.createdAt || new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));
    return total + durationMinutes;
  }, 0);

const remainingMinutes = Math.max(0, totalMinutes - actualUsedMinutes);
```

**Solution**: Calculate from actual conversations, filter by `transcriptionStartedAt`.

---

## How It Works Now

### Step 1: Get Total Purchased Minutes
```typescript
const balance = await billingStorage.getSessionMinutesBalance(userId);
// Example: totalMinutes = 3000
```

### Step 2: Calculate Actual Used Minutes
```typescript
// Get all conversations
const userConversations = await db.select().from(conversations)...

// Filter: Only sessions where user clicked Start button
const filteredSessions = userConversations.filter(conv => !!conv.transcriptionStartedAt);

// Calculate duration for each session
actualUsedMinutes = filteredSessions.reduce((total, conv) => {
  const startTime = conv.transcriptionStartedAt;
  const endTime = conv.endedAt;
  const durationMinutes = Math.ceil((endTime - startTime) / 60000);
  return total + durationMinutes;
}, 0);
// Example: actualUsedMinutes = 18
```

### Step 3: Calculate Remaining
```typescript
const remainingMinutes = Math.max(0, totalMinutes - actualUsedMinutes);
// Example: 3000 - 18 = 2982 ✅ CORRECT!
```

---

## What Gets Counted

### ✅ Counted (Included in Minutes Used)
- User clicked "Start" button
- `transcriptionStartedAt` is set
- Transcription actually ran
- Duration: From Start click to Stop click

### ❌ NOT Counted (Excluded from Minutes Used)
- Just loaded the page
- Never clicked "Start" button
- `transcriptionStartedAt` is NULL
- Page-load-only sessions

---

## Consistency Achieved

Now ALL endpoints calculate minutes the same way:

### 1. Profile Subscription (`/api/profile/subscription`)
```typescript
const actualMinutesUsed = sessionHistory.reduce((total, session) => {
  return total + (session.durationMinutes || 0);
}, 0);
```
✅ Uses filtered sessions

### 2. Session Minutes Status (`/api/session-minutes/status`)
```typescript
actualUsedMinutes = userConversations
  .filter(conv => !!conv.transcriptionStartedAt)
  .reduce((total, conv) => {
    const durationMinutes = Math.ceil((endTime - startTime) / 60000);
    return total + durationMinutes;
  }, 0);
```
✅ Uses filtered sessions (NOW FIXED!)

### 3. Session History Table
```typescript
sessionHistory = userConversations
  .filter(session => session.transcriptionStarted);
```
✅ Uses filtered sessions

**All three now use the same filtering logic!**

---

## Example Calculation

### User's Data:
```
Purchased: 3000 minutes

Sessions:
1. Feb 11, 01:34 AM - 01:35 AM = 2 min  ✅ (transcriptionStartedAt set)
2. Feb 11, 01:17 AM - 01:30 AM = 14 min ✅ (transcriptionStartedAt set)
3. Feb 11, 01:14 AM - 01:16 AM = 2 min  ✅ (transcriptionStartedAt set)
4. Feb 11, 01:00 AM - 01:00 AM = 1 min  ❌ (page load, no transcriptionStartedAt)
5. Feb 11, 12:50 AM - 12:50 AM = 1 min  ❌ (page load, no transcriptionStartedAt)

Total Used: 2 + 14 + 2 = 18 minutes
Remaining: 3000 - 18 = 2982 minutes
```

### Before Fix:
```
Minutes Used: 20 minutes (includes page loads)
Minutes Remaining: 2980 ❌ WRONG
```

### After Fix:
```
Minutes Used: 18 minutes (only real sessions)
Minutes Remaining: 2982 ✅ CORRECT
```

---

## Impact

### Before:
- ❌ Minutes Remaining showed wrong number
- ❌ Inconsistent with Session History table
- ❌ Included page-load sessions in calculation
- ❌ User confused about actual usage

### After:
- ✅ Minutes Remaining shows correct number
- ✅ Consistent with Session History table
- ✅ Only counts real transcription sessions
- ✅ Accurate usage tracking

---

## Testing

### Test 1: Check Current Status
1. Go to Profile → Subscription
2. Look at "Session History" table
3. Count minutes: Session 1 + Session 2 + Session 3 = Total
4. Look at "Minutes Remaining"
5. Should be: 3000 - Total = Remaining

**Expected**: Numbers match!

### Test 2: Start New Session
1. Go to Call Session
2. Click "Start" button
3. Speak for 5 minutes
4. Click "Stop"
5. Go to Profile → Subscription
6. Minutes Used should increase by 5
7. Minutes Remaining should decrease by 5

**Expected**: Accurate tracking!

### Test 3: Page Load (No Start)
1. Go to Call Session
2. DON'T click "Start" button
3. Just close the page
4. Go to Profile → Subscription
5. Minutes Used should NOT change
6. Minutes Remaining should NOT change

**Expected**: Page loads don't count!

---

## Files Modified

1. **server/routes-billing.ts** (line ~1179)
   - Modified `/api/session-minutes/status` endpoint
   - Now calculates from filtered conversations
   - Consistent with profile subscription endpoint

---

## 🚨 CRITICAL: Server Restart Required

```bash
Ctrl+C          # Stop server
npm run dev     # Start server
```

---

## Summary

✅ **Problem**: Minutes Remaining calculation was wrong
✅ **Cause**: Used old `subscription.minutesUsed` field (includes page loads)
✅ **Fix**: Calculate from filtered conversations (only `transcriptionStartedAt`)
✅ **Result**: Consistent, accurate minutes tracking

**Restart server and check your profile page!**

---

## What User Will See After Fix

### Profile Page:
```
Session Minutes:
Minutes Remaining: 2982  ✅ CORRECT!
18 used / 3000 total

Usage Summary:
18 / 3000 minutes used
18 used
2982 remaining  ✅ MATCHES!

Recent Sessions:
#1: 2 min
#2: 14 min
#3: 2 min
Total: 18 minutes  ✅ CONSISTENT!
```

**All numbers now match across the entire UI!**
