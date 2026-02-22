# Addon Type Mapping Fix

## Issue
Users purchasing session minutes were seeing "Train Me Add-on" in their invoices and purchase records instead of the correct "Session Minutes" package name.

## Root Cause
In the `activateCartCheckout` function (line 157-165), when processing cart items with `addonType === 'service'`, the code was:
1. Checking if package name contains "train" → map to `train_me`
2. Checking if package name contains "dai" → map to `dai`
3. **Defaulting to `train_me` for everything else**

This meant that session minutes packages labeled as 'service' type were incorrectly mapped to `train_me` instead of `session_minutes`.

## Fix Applied
Updated the mapping logic to:
1. **Check for session minutes FIRST** (before train_me/dai)
   - Check if package SKU or name contains "session" or "minute"
   - Map to `session_minutes` if found
2. Check for train_me (package contains "train")
3. Check for dai (package contains "dai")
4. **Fallback check**: Look at package `type` field
   - If `type === 'usage_bundle'` → map to `session_minutes`
5. Final fallback: default to `train_me`

## Code Changes
```typescript
// OLD CODE (INCORRECT)
else if (item.addonType === 'service') {
  if (packageSkuLower.includes('train') || packageNameLower.includes('train')) {
    mappedAddonType = 'train_me';
  } else if (packageSkuLower.includes('dai') || packageNameLower.includes('dai')) {
    mappedAddonType = 'dai';
  } else {
    mappedAddonType = 'train_me'; // ❌ Wrong default
  }
}

// NEW CODE (CORRECT)
else if (item.addonType === 'service') {
  // Check for session minutes FIRST
  if (packageSkuLower.includes('session') || packageSkuLower.includes('minute') || 
      packageNameLower.includes('session') || packageNameLower.includes('minute')) {
    mappedAddonType = 'session_minutes'; // ✅ Correct mapping
  } else if (packageSkuLower.includes('train') || packageNameLower.includes('train')) {
    mappedAddonType = 'train_me';
  } else if (packageSkuLower.includes('dai') || packageNameLower.includes('dai')) {
    mappedAddonType = 'dai';
  } else {
    // Check package type as fallback
    const pkgType = pkg.type || '';
    if (pkgType === 'usage_bundle') {
      mappedAddonType = 'session_minutes';
    } else {
      mappedAddonType = 'train_me';
    }
  }
}
```

## Impact
- ✅ Session minutes purchases now correctly show "Session Minutes" in invoices
- ✅ Purchase records have correct `addonType: 'session_minutes'`
- ✅ Invoice descriptions match the actual product purchased
- ✅ Works with the invoice display fix (uses `packageName` from metadata)
- ✅ Backward compatible - doesn't affect existing purchases

## Related Fixes
This fix works together with:
1. **Invoice Display Fix** (`INVOICE_DISPLAY_FIX.md`) - Uses `packageName` from metadata instead of hardcoded descriptions
2. **Session Summary Fix** (`SESSION_SUMMARY_FIX.md`) - Saves meeting minutes summaries to session history

## Testing
To verify the fix:
1. Add a session minutes package to cart
2. Complete checkout
3. View invoice from billing history
4. Confirm it shows "Session Minutes" (not "Train Me")
5. Check purchase record in database - `addonType` should be `'session_minutes'`

## Files Modified
- `server/routes-billing.ts` - Updated `activateCartCheckout` function (line 157-165)

## Note for Future
If adding new addon types, ensure the mapping logic checks for them explicitly rather than relying on the default fallback.
