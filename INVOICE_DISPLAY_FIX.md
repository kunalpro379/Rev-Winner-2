# Invoice Display Fix - Correct Package Names

## Issue
User purchased "Session Minutes" but the invoice displayed "Train Me Add-on (Monthly)" instead. The invoice was using hardcoded descriptions based on `addonType` rather than the actual `packageName` from the purchase metadata.

## Root Cause
The invoice generation code in `server/routes-billing.ts` had two issues:

1. **Item Display**: The invoice items were using `addonType` to determine what to display, but `addonType` can be mapped (e.g., 'service' → 'train_me') during cart activation, which doesn't reflect the actual product purchased.

2. **Description Generation**: The `getItemDescription()` function used a switch statement based on `addonType` with hardcoded descriptions, ignoring the actual `packageName` stored in the purchase metadata.

## Changes Made

### 1. Fixed Invoice Items Display (Line ~3590)
```typescript
// CRITICAL FIX: Use packageName from metadata as the primary source of truth
const displayName = metadata.packageName || purchase.packageSku;

return {
  packageSku: purchase.packageSku,
  packageName: displayName, // Use actual package name from metadata
  addonType: purchase.addonType,
  // ... rest of the fields
};
```

### 2. Fixed Description Generation (Line ~3800)
Rewrote `getItemDescription()` to:
- **Primary**: Use `packageName` from metadata if available
- **Smart Detection**: Analyze the package name to determine the correct description
- **Fallback**: Only use `addonType`-based descriptions if no package name exists

```typescript
function getItemDescription(addonType: string, metadata: any): string {
  // CRITICAL FIX: Always use packageName from metadata if available
  const packageName = metadata.packageName || '';
  
  if (packageName) {
    const nameLower = packageName.toLowerCase();
    
    if (nameLower.includes('session') || nameLower.includes('minute')) {
      return `${packageName}. Provides AI-powered conversation analysis...`;
    } else if (nameLower.includes('train')) {
      return `${packageName}. Personalized AI coaching...`;
    }
    // ... other package types
  }
  
  // Fallback to addonType-based descriptions
  // ...
}
```

## Impact
- ✅ Invoices now display the correct package name from the purchase
- ✅ Descriptions match the actual product purchased
- ✅ Works for all addon types: session_minutes, train_me, dai, platform_access
- ✅ Handles both cart purchases and direct purchases
- ✅ Backward compatible with existing purchases

## Testing
To verify the fix:
1. Add any package to cart
2. Complete checkout
3. View invoice from billing history
4. Confirm the invoice shows the correct package name and description

## Files Modified
- `server/routes-billing.ts` - Invoice generation endpoint and helper functions
