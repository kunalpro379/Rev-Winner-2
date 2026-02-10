# Cart Discount Bug Fix

## Problem Summary
User purchased 3 items with promo codes applied:
- **Expected Total (at checkout)**: $83.38 (after $286.34 discount)
- **Actual Charged**: $7,567.46 (NO discount applied)
- **Discrepancy**: 90x overcharge

## Root Cause Analysis

### Issue 1: Invoice Calculation Bug (FIXED)
**Location**: `server/routes-billing.ts` line ~143

**Problem**: When activating cart purchases, the code calculated each item's paid amount proportionally based on the **original base price** instead of the **discounted price**.

```typescript
// BEFORE (WRONG):
const itemPaidAmount = (totalPaidAmount * parseFloat(item.basePrice)) / parseFloat(metadata.subtotal || '1');

// AFTER (FIXED):
const itemDiscountedPrice = itemBasePrice - itemDiscount;
const cartDiscountedSubtotal = cartSubtotal - cartDiscount;
const itemPaidAmount = (totalPaidAmount * itemDiscountedPrice) / (cartDiscountedSubtotal || 1);
```

**Impact**: Invoices showed full prices without discounts applied.

### Issue 2: Potential Payment Gateway Bug (NEEDS VERIFICATION)
**Location**: `server/routes-billing.ts` line ~2275

The code correctly calculates:
```typescript
const cartTotal = await billingStorage.calculateCartTotal(userId);
let finalAmount = Math.round(cartTotal.total * 100) / 100; // Should include discount
```

However, the actual charge was $7,567.46 instead of $83.38, suggesting either:
1. The cart items didn't have `appliedDiscountAmount` set when checkout was initiated
2. The payment gateway received the wrong amount
3. Currency conversion went wrong

## What Was Fixed

### 1. Proportional Amount Calculation
Now correctly calculates each item's share of the total payment based on discounted prices:
- Extracts discount info from `perItemPromoCodes` metadata
- Calculates `itemDiscountedPrice = basePrice - discount`
- Uses discounted subtotal for proportional allocation

### 2. Added Debug Logging
```typescript
console.log(`[Cart Activation] Item pricing - basePrice: ${itemBasePrice}, discount: ${itemDiscount}, discountedPrice: ${itemDiscountedPrice}, paidAmount: ${itemPaidAmount.toFixed(2)} ${actualCurrency}`);
```

## How Discounts Should Work

### 1. Add Items to Cart
```
POST /api/cart/items
- Stores basePrice (original price)
- No discount yet
```

### 2. Apply Promo Code to Each Item
```
POST /api/cart/items/:cartItemId/promo
- Validates promo code
- Calculates discount amount
- Stores in appliedDiscountAmount field
```

### 3. Calculate Cart Total
```
GET /api/cart/total
- Subtotal = sum of (basePrice * quantity)
- Discount = sum of appliedDiscountAmount
- GST = (subtotal - discount) * 0.18
- Total = subtotal - discount + GST
```

### 4. Checkout
```
POST /api/cart/checkout
- Uses cartTotal.total (includes discount)
- Creates pending order with finalAmount
- Sends finalAmount to payment gateway
```

### 5. Payment Verification
```
POST /api/cart/verify
- Verifies payment amount matches pending order
- Activates purchases with correct amounts
- Generates invoice with discounted prices
```

## Testing Recommendations

1. **Test Cart Discount Flow**:
   ```bash
   # Add items to cart
   # Apply promo codes
   # Check cart total shows discounts
   # Verify payment gateway receives discounted amount
   ```

2. **Verify Invoice Accuracy**:
   ```bash
   # Complete a purchase with discounts
   # Check invoice shows:
   #   - Original prices
   #   - Discount amounts
   #   - Final paid amount matches payment
   ```

3. **Check Edge Cases**:
   - Multiple items with different discounts
   - Currency conversion with discounts
   - GST calculation on discounted amounts

## Files Modified

1. `server/routes-billing.ts`
   - Fixed `activateCartCheckout()` function
   - Added proper discount calculation for item amounts
   - Added debug logging

## Next Steps

1. **Immediate**: Test the fix with a new purchase
2. **Short-term**: Add validation to prevent overcharging
3. **Long-term**: Add automated tests for discount calculations
4. **Customer Service**: Process refund for the overcharged amount ($7,484.08)

## Refund Calculation

```
Charged: $7,567.46
Should have been: $83.38
Refund due: $7,484.08
```

The customer should be refunded the difference immediately.
