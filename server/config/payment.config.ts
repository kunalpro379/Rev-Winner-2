/**
 * Payment Gateway Configuration
 * 
 * This file centralizes the payment gateway configuration for the entire application.
 * To switch payment gateways, simply change the DEFAULT_PAYMENT_GATEWAY constant.
 * 
 * Currently supported gateways:
 * - razorpay: Razorpay Payment Gateway (India)
 * - cashfree: Cashfree Payment Gateway (India)
 * - stripe: Stripe (Coming soon)
 */

import { PaymentGatewayProvider } from "../services/payments/PaymentGatewayFactory";

// ========================================
// MAIN CONFIGURATION - CHANGE THIS TO SWITCH GATEWAYS
// ========================================

/**
 * Default Payment Gateway
 * 
 * Change this value to switch between payment gateways:
 * - "razorpay" - Use Razorpay
 * - "cashfree" - Use Cashfree (Current default)
 * - "stripe" - Use Stripe (Not yet implemented)
 * 
 * You can also set PAYMENT_GATEWAY environment variable to override this
 */
export const DEFAULT_PAYMENT_GATEWAY: PaymentGatewayProvider = 
  (process.env.PAYMENT_GATEWAY as PaymentGatewayProvider) || "razorpay";

// ========================================
// GATEWAY-SPECIFIC CONFIGURATIONS
// ========================================

/**
 * Razorpay Configuration
 * Credentials should be set in .env file
 */
export const RAZORPAY_CONFIG = {
  name: "Razorpay",
  description: "Razorpay Payment Gateway",
  supportedCurrencies: ["INR", "USD"],
  features: ["orders", "refunds", "webhooks", "subscriptions"],
  docsUrl: "https://razorpay.com/docs/",
  dashboardUrl: "https://dashboard.razorpay.com/",
  
  // Environment variables required
  envVars: {
    test: {
      keyId: "RAZORPAY_TEST_KEY_ID",
      keySecret: "RAZORPAY_TEST_KEY_SECRET",
      webhookSecret: "RAZORPAY_TEST_WEBHOOK_SECRET"
    },
    live: {
      keyId: "RAZORPAY_LIVE_KEY_ID",
      keySecret: "RAZORPAY_LIVE_KEY_SECRET",
      webhookSecret: "RAZORPAY_LIVE_WEBHOOK_SECRET"
    }
  }
};

/**
 * Cashfree Configuration
 * Credentials should be set in .env file
 */
export const CASHFREE_CONFIG = {
  name: "Cashfree",
  description: "Cashfree Payment Gateway",
  supportedCurrencies: ["INR", "USD"],
  features: ["orders", "refunds", "webhooks"],
  docsUrl: "https://docs.cashfree.com/",
  dashboardUrl: "https://merchant.cashfree.com/",
  
  // Environment variables required
  envVars: {
    sandbox: {
      appId: "CASHFREE_SANDBOX_APP_ID",
      secretKey: "CASHFREE_SANDBOX_SECRET_KEY",
      webhookSecret: "CASHFREE_SANDBOX_WEBHOOK_SECRET"
    },
    production: {
      appId: "CASHFREE_APP_ID",
      secretKey: "CASHFREE_SECRET_KEY",
      webhookSecret: "CASHFREE_WEBHOOK_SECRET"
    }
  }
};

/**
 * Stripe Configuration (Coming soon)
 * Credentials should be set in .env file
 */
export const STRIPE_CONFIG = {
  name: "Stripe",
  description: "Stripe Payment Gateway",
  supportedCurrencies: ["USD", "EUR", "GBP", "INR"],
  features: ["orders", "refunds", "webhooks", "subscriptions"],
  docsUrl: "https://stripe.com/docs",
  dashboardUrl: "https://dashboard.stripe.com/",
  
  // Environment variables required
  envVars: {
    test: {
      publicKey: "STRIPE_TEST_PUBLIC_KEY",
      secretKey: "STRIPE_TEST_SECRET_KEY",
      webhookSecret: "STRIPE_TEST_WEBHOOK_SECRET"
    },
    live: {
      publicKey: "STRIPE_LIVE_PUBLIC_KEY",
      secretKey: "STRIPE_LIVE_SECRET_KEY",
      webhookSecret: "STRIPE_LIVE_WEBHOOK_SECRET"
    }
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get configuration for current payment gateway
 */
export function getCurrentGatewayConfig() {
  switch (DEFAULT_PAYMENT_GATEWAY) {
    case "razorpay":
      return RAZORPAY_CONFIG;
    case "cashfree":
      return CASHFREE_CONFIG;
    case "stripe":
      return STRIPE_CONFIG;
    default:
      return RAZORPAY_CONFIG;
  }
}

/**
 * Get all available payment gateways
 */
export function getAvailableGateways() {
  return {
    razorpay: RAZORPAY_CONFIG,
    cashfree: CASHFREE_CONFIG,
    stripe: STRIPE_CONFIG
  };
}

/**
 * Check if a payment gateway is configured
 */
export function isGatewayConfigured(provider: PaymentGatewayProvider): boolean {
  const environment = process.env.ENVIRONMENT || 'DEV';
  const isProduction = environment === 'PROD' || environment === 'PRODUCTION';
  
  switch (provider) {
    case "razorpay":
      const razorpayMode = isProduction ? 'LIVE' : 'TEST';
      
      if (razorpayMode === 'TEST') {
        return !!(process.env.RAZORPAY_TEST_KEY_ID && process.env.RAZORPAY_TEST_KEY_SECRET);
      } else {
        return !!(process.env.RAZORPAY_LIVE_KEY_ID && process.env.RAZORPAY_LIVE_KEY_SECRET);
      }
      
    case "cashfree":
      const cashfreeEnv = isProduction ? 'PRODUCTION' : 'SANDBOX';
      
      if (cashfreeEnv === 'SANDBOX') {
        return !!(process.env.CASHFREE_SANDBOX_APP_ID && process.env.CASHFREE_SANDBOX_SECRET_KEY);
      } else {
        return !!(process.env.CASHFREE_PROD_APP_ID && process.env.CASHFREE_PROD_SECRET_KEY);
      }
      
    case "stripe":
      return false; // Not implemented yet
      
    default:
      return false;
  }
}

/**
 * Log current payment gateway configuration (for debugging)
 */
export function logPaymentGatewayConfig() {
  const config = getCurrentGatewayConfig();
  const isConfigured = isGatewayConfigured(DEFAULT_PAYMENT_GATEWAY);
  
  // Use ENVIRONMENT variable (DEV/PROD/PRODUCTION) instead of NODE_ENV
  const environment = process.env.ENVIRONMENT || 'DEV';
  const isProduction = environment === 'PROD' || environment === 'PRODUCTION';
  
  console.log("=".repeat(60));
  console.log("💳 PAYMENT GATEWAY CONFIGURATION");
  console.log("=".repeat(60));
  console.log(`Current Gateway: ${config.name} (${DEFAULT_PAYMENT_GATEWAY})`);
  console.log(`Source: ${process.env.PAYMENT_GATEWAY ? 'Environment Variable' : 'Default Config'}`);
  console.log(`Configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);
  console.log(`Environment: ${environment} (${isProduction ? 'LIVE' : 'TEST'})`);
  console.log(`Supported Currencies: ${config.supportedCurrencies.join(', ')}`);
  console.log(`Features: ${config.features.join(', ')}`);
  
  // Show which credentials are being used
  if (DEFAULT_PAYMENT_GATEWAY === 'razorpay') {
    const razorpayMode = isProduction ? 'LIVE' : 'TEST';
    const keyId = isProduction
      ? process.env.RAZORPAY_LIVE_KEY_ID
      : process.env.RAZORPAY_TEST_KEY_ID;
    console.log(`Razorpay Mode: ${razorpayMode}`);
    console.log(`Razorpay Key ID: ${keyId?.substring(0, 15)}...`);
  } else if (DEFAULT_PAYMENT_GATEWAY === 'cashfree') {
    const cashfreeEnv = isProduction ? 'PRODUCTION' : 'SANDBOX';
    const appId = isProduction
      ? process.env.CASHFREE_PROD_APP_ID
      : process.env.CASHFREE_SANDBOX_APP_ID;
    console.log(`Cashfree Environment: ${cashfreeEnv}`);
    console.log(`Cashfree App ID: ${appId?.substring(0, 15)}...`);
  }
  
  console.log("=".repeat(60));
  
  if (!isConfigured) {
    console.warn(`⚠️  ${config.name} is not properly configured!`);
    console.warn(`   Please add the required environment variables to your .env file.`);
    console.warn(`   See: ${config.docsUrl}`);
  }
}


