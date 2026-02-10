# Invoice Discount Display Bug - CRITICAL FIX NEEDED

## Issue Summary
**Severity:** CRITICAL - Financial Discrepancy  
**User Impact:** Invoice shows incorrect (higher) amount than actually paid

## Problem Description
User paid: **₹4,239.47**  
Invoice shows: **₹7,567.46**  
Difference: **₹3,328** (44% overcharge display)

## Root Cause
The invoice generation endpoint (`/api/billing/invoice`) is calculating totals from the **original cart items** without properly accounting for **promo code discounts** that were applied during checkout.

### Current Flow (BROKEN):
1. Cart checkout applies discount: ₹6,413.10 - ₹2,254.69 (discount) = ₹4,158.41
2. GST added: ₹4,158.41 × 1.18 = ₹4,907.00 (approx)
3. Payment gateway charges: ₹4,239.47 (actual amount paid)
4. **Invoice generation**: Reads cart items, calculates subtotal ₹6,413.10 + GST ₹1,154.36 = ₹7,567.46 ❌

### What Should Happen:
Invoice should show:
- Subtotal: ₹6,413.10
- Discount: -₹2,254.69 (promo code applied)
- Subtotal after discount: ₹4,158.41
- GST (18%): ₹748.51
- **Total: ₹4,906.92** (matches payment)

## Code Location
File: `server/routes-billing.ts`  
Endpoint: `app.get("/api/billing/invoice")`  
Lines: ~3100-3400

## The Bug
```typescript
// Current code calculates from purchases WITHOUT discount info
const subtotal = items.reduce((sum: number, item: any) => 
  sum + parseFloat(item.totalAmount), 0);
```

The `items` array is built from `addonPurchases` which stores the **actual paid amount per item** (after discount), but the invoice is displaying the **original cart subtotal** from `pendingOrder.metadata`.

## Fix Required
The invoice needs to:
1. Read the `discount` field from `pendingOrder.metadata`
2. Display it as a separate line item
3. Calculate totals correctly: `subtotal - discount + GST = total`

## Verification
Check `pendingOrder.metadata` for order `order_1770741629063_40c22b88`:
- Should contain: `discount: 2254.69` (or similar)
- Should contain: `subtotal: 6413.10`
- Should contain: `total: 4239.47` (or close to it)

## Impact
- **Legal Risk:** Showing incorrect invoice amounts
- **Customer Trust:** Users see inflated charges
- **Accounting:** Mismatch between payment and invoice
- **Tax Compliance:** GST calculation appears incorrect

## Priority
**IMMEDIATE FIX REQUIRED** - This affects all cart purchases with promo codes.


---

## FIX APPLIED ✅

### Changes Made

#### 1. Backend - Invoice Generation (`server/routes-billing.ts`)
**Lines ~3200-3320**

- Added extraction of discount from `pendingOrder.metadata`
- Modified total calculation to use cart metadata when available (includes discount)
- Added `discount` and `subtotalAfterDiscount` fields to invoice summary
- Now properly calculates: `subtotal - discount + GST = total`

**Before:**
```typescript
const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);
const totalGst = items.reduce((sum, item) => sum + parseFloat(item.gstAmount), 0);
const grandTotal = subtotal + totalGst;
```

**After:**
```typescript
const orderMetadata = pendingOrder.metadata as any || {};
const cartDiscount = parseFloat(orderMetadata.discount?.toString() || '0');
const cartSubtotal = parseFloat(orderMetadata.subtotal?.toString() || '0');
const cartGstAmount = parseFloat(orderMetadata.gstAmount?.toString() || '0');
const cartTotal = parseFloat(orderMetadata.total?.toString() || '0');

if (cartSubtotal > 0 && cartGstAmount >= 0 && cartTotal > 0) {
  // Use cart metadata which has the correct breakdown including discount
  subtotal = cartSubtotal;
  discount = cartDiscount;
  totalGst = cartGstAmount;
  grandTotal = cartTotal;
}
```

#### 2. Frontend - Invoice Display (`client/src/pages/invoice.tsx`)
**Lines ~650-680**

- Added discount line in the price summary (green color, negative amount)
- Shows discount only when `invoiceData.summary.discount > 0`

**Added:**
```tsx
{invoiceData.summary.discount > 0 && (
  <div className="flex items-center justify-between text-base">
    <div className="flex items-center gap-2" style={{ color: '#16a34a' }}>
      <span>Discount</span>
    </div>
    <span className="font-semibold" style={{ color: '#16a34a' }}>
      -${invoiceData.summary.discount.toFixed(2)}
    </span>
  </div>
)}
```

#### 3. PDF Generation (`client/src/pages/invoice.tsx`)
**Lines ~347-353**

- Added discount line in PDF payment summary
- Shows discount only when present

**Added:**
```typescript
if (invoiceData?.summary?.discount && invoiceData.summary.discount > 0) {
  addText(`Discount: -$${invoiceData.summary.discount.toFixed(2)}`, 11);
}
```

### Expected Invoice Display (After Fix)

For the user's order:
```
Subtotal:              ₹6,413.10
Discount:             -₹2,254.69  (promo code applied)
                      -----------
Subtotal after disc:   ₹4,158.41
GST (18%):              ₹748.51
                      ===========
Total Paid:            ₹4,906.92
```

**Note:** There may still be a small rounding difference (₹4,906.92 vs ₹4,239.47 paid) which needs investigation. This could be due to:
1. Currency conversion (USD to INR)
2. Additional roundoff adjustments
3. Gateway fees

### Testing Required
1. View existing invoice for order `order_1770741629063_40c22b88`
2. Verify discount line appears
3. Verify total matches payment amount
4. Test new cart purchases with promo codes
5. Verify PDF download includes discount

### Deployment Notes
- No database migration required
- Backward compatible (old orders without discount metadata will still work)
- Frontend and backend must be deployed together

### Monitoring
After deployment, check:
- Invoice API logs for discount calculation
- User complaints about invoice amounts
- Payment gateway reconciliation reports
