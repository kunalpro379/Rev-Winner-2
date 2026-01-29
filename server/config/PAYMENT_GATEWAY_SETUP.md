# Payment Gateway Configuration Guide

This guide explains how to configure and switch payment gateways in Rev Winner.

## Current Setup

**Current Default Gateway:** **Razorpay** 🎉

The default payment gateway is configured in `server/config/payment.config.ts`.

## Quick Start - Razorpay Setup

### 1. Get Your Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in
3. Navigate to **Settings** → **API Keys**
4. Generate/view your API keys

### 2. Configure Environment Variables

Add these to your `.env` file:

#### For Development (Test Mode)
```env
# Razorpay Test Mode
RAZORPAY_MODE=TEST
RAZORPAY_TEST_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_TEST_KEY_SECRET=your_test_key_secret_here
RAZORPAY_TEST_WEBHOOK_SECRET=your_test_webhook_secret_here
```

#### For Production (Live Mode)
```env
# Razorpay Live Mode
RAZORPAY_MODE=LIVE
RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_LIVE_KEY_SECRET=your_live_key_secret_here
RAZORPAY_LIVE_WEBHOOK_SECRET=your_live_webhook_secret_here
```

### 3. Test the Connection

Start your server and check the logs. You should see:

```
============================================================
💳 PAYMENT GATEWAY CONFIGURATION
============================================================
Current Gateway: Razorpay (razorpay)
Configured: ✅ Yes
Environment: development
Supported Currencies: INR, USD
Features: orders, refunds, webhooks, subscriptions
============================================================
```

## Switching Payment Gateways

Want to switch to Cashfree or another gateway? Here's how:

### Step 1: Edit the Config File

Open `server/config/payment.config.ts` and change this line:

```typescript
// Change from:
export const DEFAULT_PAYMENT_GATEWAY: PaymentGatewayProvider = "razorpay";

// To (for example):
export const DEFAULT_PAYMENT_GATEWAY: PaymentGatewayProvider = "cashfree";
```

### Step 2: Add New Gateway Credentials

Add the new gateway's credentials to your `.env` file.

For **Cashfree**:
```env
CASHFREE_ENVIRONMENT=SANDBOX
CASHFREE_SANDBOX_APP_ID=your_app_id_here
CASHFREE_SANDBOX_SECRET_KEY=your_secret_key_here
CASHFREE_SANDBOX_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 3: Restart the Server

```bash
npm run dev
```

The server will automatically initialize the new payment gateway.

## Supported Payment Gateways

### ✅ Razorpay (Current Default)
- **Status:** Fully implemented
- **Docs:** https://razorpay.com/docs/
- **Dashboard:** https://dashboard.razorpay.com/
- **Currencies:** INR, USD
- **Features:** Orders, Refunds, Webhooks, Subscriptions

### ✅ Cashfree (Alternative)
- **Status:** Fully implemented
- **Docs:** https://docs.cashfree.com/
- **Dashboard:** https://merchant.cashfree.com/
- **Currencies:** INR, USD
- **Features:** Orders, Refunds, Webhooks

### 🚧 Stripe (Coming Soon)
- **Status:** Not yet implemented
- **Docs:** https://stripe.com/docs
- **Dashboard:** https://dashboard.stripe.com/
- **Currencies:** USD, EUR, GBP, INR, and more
- **Features:** Orders, Refunds, Webhooks, Subscriptions

## Environment Variable Reference

### Razorpay Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_MODE` | No | `TEST` or `LIVE` (auto-detected if not set) |
| `RAZORPAY_TEST_KEY_ID` | Yes* | Test mode Key ID (starts with `rzp_test_`) |
| `RAZORPAY_TEST_KEY_SECRET` | Yes* | Test mode Key Secret |
| `RAZORPAY_TEST_WEBHOOK_SECRET` | No | Test mode Webhook Secret |
| `RAZORPAY_LIVE_KEY_ID` | Yes** | Live mode Key ID (starts with `rzp_live_`) |
| `RAZORPAY_LIVE_KEY_SECRET` | Yes** | Live mode Key Secret |
| `RAZORPAY_LIVE_WEBHOOK_SECRET` | No | Live mode Webhook Secret |

*Required for development/test mode  
**Required for production/live mode

### Cashfree Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CASHFREE_ENVIRONMENT` | No | `SANDBOX` or `PRODUCTION` (auto-detected if not set) |
| `CASHFREE_SANDBOX_APP_ID` | Yes* | Sandbox App ID |
| `CASHFREE_SANDBOX_SECRET_KEY` | Yes* | Sandbox Secret Key |
| `CASHFREE_SANDBOX_WEBHOOK_SECRET` | No | Sandbox Webhook Secret |
| `CASHFREE_APP_ID` | Yes** | Production App ID |
| `CASHFREE_SECRET_KEY` | Yes** | Production Secret Key |
| `CASHFREE_WEBHOOK_SECRET` | No | Production Webhook Secret |

*Required for development/sandbox mode  
**Required for production mode

## Troubleshooting

### Payment Gateway Not Configured

If you see this error:
```
⚠️  Razorpay is not properly configured!
   Please add the required environment variables to your .env file.
```

**Solution:** Make sure you've added the correct credentials to your `.env` file based on your mode (TEST/LIVE or SANDBOX/PRODUCTION).

### Wrong Credentials for Mode

If you see this warning:
```
⚠️  WARNING: Using main credentials for TEST mode.
```

**Solution:** Add mode-specific credentials to your `.env` file:
- For Razorpay: `RAZORPAY_TEST_KEY_ID` and `RAZORPAY_TEST_KEY_SECRET`
- For Cashfree: `CASHFREE_SANDBOX_APP_ID` and `CASHFREE_SANDBOX_SECRET_KEY`

### Payment Fails in Production

**Checklist:**
1. ✅ Are you using LIVE/PRODUCTION credentials?
2. ✅ Is `RAZORPAY_MODE` set to `LIVE` (or `NODE_ENV` set to `production`)?
3. ✅ Have you activated your Razorpay account and completed KYC?
4. ✅ Is your webhook URL configured in the Razorpay dashboard?

## Architecture

The payment gateway system is designed to be flexible and easily extendable:

```
server/config/payment.config.ts          # Main configuration file
server/services/payments/
  ├── IPaymentGateway.ts                 # Gateway interface
  ├── PaymentGatewayFactory.ts           # Factory pattern for gateways
  ├── RazorpayAdapter.ts                 # Razorpay implementation
  ├── CashfreeAdapter.ts                 # Cashfree implementation
  └── index.ts                           # Exports
server/services/billing/
  └── init-gateway.ts                    # Gateway initialization on startup
```

### Adding a New Gateway

To add a new payment gateway (e.g., Stripe):

1. Create a new adapter: `server/services/payments/StripeAdapter.ts`
2. Implement the `IPaymentGateway` interface
3. Add the gateway to `PaymentGatewayFactory.ts`
4. Add configuration to `payment.config.ts`
5. Update this README

## Support

For payment gateway specific issues:
- **Razorpay:** support@razorpay.com or https://razorpay.com/support/
- **Cashfree:** care@cashfree.com or https://www.cashfree.com/contact/

For Rev Winner configuration issues:
- Check the server logs for detailed error messages
- Verify your environment variables
- Review this guide

