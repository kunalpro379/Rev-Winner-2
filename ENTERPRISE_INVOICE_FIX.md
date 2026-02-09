# Enterprise Invoice Generation Fix

## Problem
After successfully completing an enterprise purchase, the invoice page showed:
```
Invoice Not Found
We couldn't find the invoice you're looking for.
```

Backend error:
```
GET /api/billing/invoice 404 :: {"message":"Order not found"}
```

## Root Cause
The invoice endpoint (`/api/billing/invoice`) was only looking for orders in the `pendingOrders` table. However, enterprise purchases:
1. Use a different order ID format (`ent_xxx` instead of regular order IDs)
2. Store payment information directly in the `payments` table
3. Don't create addon purchases (they create organizations and licenses instead)

The invoice endpoint couldn't find enterprise orders because it was only checking `pendingOrders`.

## Solution
Updated the invoice endpoint to handle enterprise purchases:

1. **Detect enterprise orders**: Check if order ID starts with `ent_`
2. **Look in payments table**: Query the `payments` table directly for enterprise orders
3. **Parse metadata**: Extract enterprise purchase details from payment metadata
4. **Build invoice data**: Create invoice structure from payment and metadata
5. **Return invoice**: Send formatted invoice data to frontend

### Code Changes

```typescript
// NEW: Handle enterprise purchases
if (!pendingOrder && orderId.startsWith('ent_')) {
  console.log(`[Invoice Debug] Enterprise order detected: ${orderId}`);
  
  // Look directly in payments table
  const payment = await authStorage.getPaymentByRazorpayOrderId(orderId);
  
  if (!payment || payment.userId !== userId) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  if (payment.status !== 'success') {
    return res.status(400).json({ message: "Order is not completed yet" });
  }
  
  // Parse metadata
  const metadata = typeof payment.metadata === 'string'
    ? JSON.parse(payment.metadata)
    : (payment.metadata || {});
  
  // Build invoice data
  const invoiceData = {
    orderId: orderId,
    userId: userId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod || 'Cashfree',
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    createdAt: payment.createdAt,
    items: [{
      name: `Enterprise License - ${metadata.totalSeats} seats (${metadata.packageType})`,
      description: `Company: ${metadata.companyName}`,
      quantity: metadata.totalSeats || 1,
      unitPrice: metadata.pricePerSeat || 0,
      amount: payment.amount
    }],
    customer: {
      name: metadata.companyName || 'Enterprise Customer',
      email: metadata.billingEmail || '',
    },
    type: 'enterprise_license'
  };
  
  return res.json(invoiceData);
}
```

## Files Changed
- `server/routes-billing.ts` - Updated `/api/billing/invoice` endpoint (lines 3039-3095)

## Testing

### Test 1: Enterprise Invoice Generation
1. Complete an enterprise purchase
2. After successful payment, click "View Invoice" or "Download Invoice"
3. ✅ Invoice page should load with enterprise purchase details
4. ✅ Should show:
   - Company name
   - Number of seats
   - Package type (monthly/annual)
   - Total amount
   - Payment date
   - Payment method

### Test 2: Regular Invoice Generation
1. Purchase a regular add-on (Session Minutes, Train Me, Platform Access)
2. Click "View Invoice"
3. ✅ Invoice should still work for regular purchases
4. ✅ No regression in existing functionality

## Invoice Data Structure

### Enterprise Invoice
```json
{
  "orderId": "ent_1770657811792_5uyutpjnz",
  "userId": "user_xxx",
  "amount": "27189",
  "currency": "INR",
  "status": "success",
  "paymentMethod": "Cashfree",
  "razorpayOrderId": "order_1770657811792_7e19d296",
  "razorpayPaymentId": "cf_payment_xxx",
  "createdAt": "2026-02-09T22:53:34.000Z",
  "items": [{
    "name": "Enterprise License - 10 seats (monthly)",
    "description": "Company: Acme Corp",
    "quantity": 10,
    "unitPrice": 30,
    "amount": "27189"
  }],
  "customer": {
    "name": "Acme Corp",
    "email": "billing@acme.com"
  },
  "type": "enterprise_license"
}
```

### Regular Invoice
```json
{
  "orderId": "order_xxx",
  "userId": "user_xxx",
  "amount": "8.00",
  "currency": "USD",
  "status": "success",
  "items": [{
    "name": "Session Minutes - 500 minutes",
    "quantity": 1,
    "unitPrice": 8,
    "amount": "8.00"
  }],
  "type": "addon_purchase"
}
```

## Order ID Formats

### Enterprise Orders
- Format: `ent_<timestamp>_<random>`
- Example: `ent_1770657811792_5uyutpjnz`
- Stored in: `payments` table
- Creates: Organization + License Package

### Regular Orders
- Format: Various (UUID, order_xxx, etc.)
- Example: `bcb17c93-75e0-43e5-88f3-6ed94a53dea7`
- Stored in: `pendingOrders` table
- Creates: Addon Purchase

## Impact

### Before Fix
- ❌ Enterprise invoices showed "Invoice Not Found"
- ❌ Users couldn't view/download enterprise purchase receipts
- ❌ No proof of purchase for enterprise customers

### After Fix
- ✅ Enterprise invoices load correctly
- ✅ Shows all purchase details (company, seats, amount)
- ✅ Users can view and download invoices
- ✅ Proper proof of purchase for accounting

## Related Issues

The logs also show "REVENUE LEAK" warnings for add-ons without payment references. This is a separate issue where add-on purchases were created without proper payment tracking. This should be investigated separately.

## Status
✅ **FIXED** - Enterprise invoice generation now works correctly. Users can view and download invoices for enterprise purchases.
