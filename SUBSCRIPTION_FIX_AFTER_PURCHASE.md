# Subscription Check Fix - After Purchase

## Problem
After users purchased a platform subscription + session minutes, the platform still showed "Free Trial Expired" message instead of allowing access.

## Root Cause
The `/api/subscriptions/check-limits` endpoint was checking the OLD `subscriptions` table which was never updated with purchase data. The new purchase system uses the `addon_purchases` table instead.

## Solution Applied

### Changed File
- [server/routes.ts](server/routes.ts#L2143)

### What Was Fixed

#### Before (OLD Logic - WRONG ❌)
```typescript
// Was checking old subscriptions table
const subscription = await authStorage.getSubscriptionByUserId(userId);

// Returns "trial" status with fake limits
if (!subscription) {
  return res.json({
    canUseService: true,
    planType: "trial",
    status: "no_subscription",
    sessionsLimit: 5,      // Wrong! Trial limits
    minutesLimit: 60,      // Wrong! Trial limits
  });
}
```

**Problem:** Even if user purchased, they still showed trial limits because the old table was never populated!

#### After (NEW Logic - CORRECT ✅)
```typescript
// Now checks NEW addon_purchases table
const platformPurchases = await db
  .select()
  .from(addonPurchases)
  .where(
    and(
      eq(addonPurchases.userId, userId),
      eq(addonPurchases.addonType, 'platform_access'),
      eq(addonPurchases.status, 'active')
    )
  );

const sessionMinutesPurchases = await db
  .select()
  .from(addonPurchases)
  .where(
    and(
      eq(addonPurchases.userId, userId),
      eq(addonPurchases.addonType, 'session_minutes'),
      eq(addonPurchases.status, 'active')
    )
  );

// KEY: User must have BOTH to access platform
const canUseService = hasPlatformAccess && hasSessionMinutes;
```

## Subscription Requirements (Enforced)
Users MUST have:
1. ✅ **Platform Access** (paid addon) - active and not expired
2. ✅ **Session Minutes** (paid addon) - active, not expired, and > 0 minutes remaining

If EITHER is missing → **Cannot use platform**

## What Shows Now After Fix

### User Has Both (✅ Can Use)
```
planType: "professional"
status: "active"
canUseService: true
minutesRemaining: 5500  // or however many they purchased
```

### User Missing Minutes (❌ Cannot Use)
```
planType: "professional" 
status: "active"
canUseService: false    // ← KEY! No longer shows "free trial expired"
minutesRemaining: 0
```

### User No Purchases (❌ Trial Expired)
```
planType: "free_trial"
status: "no_subscription"
canUseService: false
```

## Implementation Details

### New API Response
```json
{
  "canUseService": true/false,
  "planType": "professional" | "free_trial",
  "status": "active" | "no_subscription",
  "minutesRemaining": number | null
}
```

### Duration Checking
- Purchases with `endDate > NOW()` are considered active
- Purchases with `endDate` in past are expired (status changes to 'expired')
- Purchases with `endDate = NULL` are perpetual (never expire)

## Testing

To test, users with purchases should now:
1. ✅ NOT see "Free Trial Expired" message
2. ✅ See their actual minutes remaining
3. ✅ Be able to start conversations
4. ✅ Platform works as expected after purchase

## Files Modified
- [server/routes.ts](server/routes.ts#L2143-L2220) - Updated check-limits endpoint
- Imports: Added `addonPurchases` and `and` to imports
