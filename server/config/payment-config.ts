/**
 * Payment Gateway Configuration
 * 
 * This module automatically selects the correct payment gateway and credentials
 * based on the PAYMENT_GATEWAY and ENVIRONMENT variables
 * 
 * - PAYMENT_GATEWAY=razorpay: Uses Razorpay
 * - PAYMENT_GATEWAY=cashfree: Uses Cashfree
 * - ENVIRONMENT=DEV: Uses TEST/SANDBOX credentials
 * - ENVIRONMENT=PROD: Uses LIVE/PRODUCTION credentials
 */

const ENVIRONMENT = process.env.ENVIRONMENT || 'DEV';
const IS_PRODUCTION = ENVIRONMENT === 'PROD' || ENVIRONMENT === 'PRODUCTION';
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'razorpay';

console.log(`🔧 Payment Configuration: ${ENVIRONMENT} mode`);
console.log(`💳 Active Payment Gateway: ${PAYMENT_GATEWAY.toUpperCase()}`);

// Razorpay Configuration
export const razorpayConfig = {
  mode: IS_PRODUCTION ? 'LIVE' : 'TEST',
  keyId: IS_PRODUCTION 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID,
  keySecret: IS_PRODUCTION 
    ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    : process.env.RAZORPAY_TEST_KEY_SECRET,
  webhookSecret: IS_PRODUCTION 
    ? process.env.RAZORPAY_LIVE_WEBHOOK_SECRET 
    : process.env.RAZORPAY_TEST_WEBHOOK_SECRET,
};

// Cashfree Configuration
export const cashfreeConfig = {
  environment: IS_PRODUCTION ? 'PRODUCTION' : 'SANDBOX',
  appId: IS_PRODUCTION 
    ? process.env.CASHFREE_APP_ID 
    : process.env.CASHFREE_SANDBOX_APP_ID,
  secretKey: IS_PRODUCTION 
    ? process.env.CASHFREE_SECRET_KEY 
    : process.env.CASHFREE_SANDBOX_SECRET_KEY,
  webhookSecret: IS_PRODUCTION 
    ? process.env.CASHFREE_WEBHOOK_SECRET 
    : undefined, // Sandbox doesn't need webhook secret
};

// Dynamic Gateway Selection
export const activeGatewayConfig = PAYMENT_GATEWAY === 'cashfree' ? cashfreeConfig : razorpayConfig;

// Validation
if (PAYMENT_GATEWAY === 'razorpay') {
  if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
    console.warn('⚠️  Razorpay credentials not configured properly');
  } else {
    console.log(`🔐 Razorpay Mode: ${razorpayConfig.mode}`);
    console.log(`✅ Razorpay configured successfully`);
  }
} else if (PAYMENT_GATEWAY === 'cashfree') {
  if (!cashfreeConfig.appId || !cashfreeConfig.secretKey) {
    console.warn('⚠️  Cashfree credentials not configured properly');
  } else {
    console.log(`🔐 Cashfree Environment: ${cashfreeConfig.environment}`);
    console.log(`✅ Cashfree configured successfully`);
  }
}

export const paymentConfig = {
  environment: ENVIRONMENT,
  isProduction: IS_PRODUCTION,
  gateway: PAYMENT_GATEWAY,
  razorpay: razorpayConfig,
  cashfree: cashfreeConfig,
  active: activeGatewayConfig,
};
