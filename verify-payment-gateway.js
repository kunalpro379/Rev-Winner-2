#!/usr/bin/env node

/**
 * Payment Gateway Configuration Verification Script
 * 
 * Run this script to verify your payment gateway configuration:
 * node verify-payment-gateway.js
 */

require('dotenv').config();

console.log('\n' + '='.repeat(70));
console.log('🔍 PAYMENT GATEWAY CONFIGURATION VERIFICATION');
console.log('='.repeat(70) + '\n');

// Check PAYMENT_GATEWAY environment variable
const paymentGateway = process.env.PAYMENT_GATEWAY;
console.log('1. Environment Variable Check:');
console.log(`   PAYMENT_GATEWAY = ${paymentGateway || '(not set)'}`);

if (!paymentGateway) {
  console.log('   ⚠️  WARNING: PAYMENT_GATEWAY not set in .env file');
  console.log('   Will use default from payment.config.ts\n');
} else if (paymentGateway === 'razorpay') {
  console.log('   ✅ Set to Razorpay\n');
} else if (paymentGateway === 'cashfree') {
  console.log('   ✅ Set to Cashfree\n');
} else {
  console.log(`   ❌ Invalid value: ${paymentGateway}`);
  console.log('   Must be "razorpay" or "cashfree"\n');
}

// Check Razorpay credentials
console.log('2. Razorpay Credentials:');
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayTestKeyId = process.env.RAZORPAY_TEST_KEY_ID;
const razorpayTestKeySecret = process.env.RAZORPAY_TEST_KEY_SECRET;

if (razorpayKeyId && razorpayKeySecret) {
  console.log(`   RAZORPAY_KEY_ID = ${razorpayKeyId.substring(0, 15)}...`);
  console.log(`   RAZORPAY_KEY_SECRET = ${razorpayKeySecret.substring(0, 10)}...`);
  console.log('   ✅ Main credentials configured');
} else {
  console.log('   ❌ Main credentials not configured');
}

if (razorpayTestKeyId && razorpayTestKeySecret) {
  console.log(`   RAZORPAY_TEST_KEY_ID = ${razorpayTestKeyId.substring(0, 15)}...`);
  console.log(`   RAZORPAY_TEST_KEY_SECRET = ${razorpayTestKeySecret.substring(0, 10)}...`);
  console.log('   ✅ Test credentials configured');
} else {
  console.log('   ⚠️  Test credentials not configured (will use main credentials)');
}
console.log();

// Check Cashfree credentials
console.log('3. Cashfree Credentials:');
const cashfreeAppId = process.env.CASHFREE_APP_ID;
const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
const cashfreeSandboxAppId = process.env.CASHFREE_SANDBOX_APP_ID;
const cashfreeSandboxSecretKey = process.env.CASHFREE_SANDBOX_SECRET_KEY;
const cashfreeEnv = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION';

console.log(`   CASHFREE_ENVIRONMENT = ${cashfreeEnv}`);

if (cashfreeAppId && cashfreeSecretKey) {
  console.log(`   CASHFREE_APP_ID = ${cashfreeAppId.substring(0, 15)}...`);
  console.log(`   CASHFREE_SECRET_KEY = ${cashfreeSecretKey.substring(0, 15)}...`);
  console.log('   ✅ Production credentials configured');
} else {
  console.log('   ❌ Production credentials not configured');
}

if (cashfreeSandboxAppId && cashfreeSandboxSecretKey) {
  console.log(`   CASHFREE_SANDBOX_APP_ID = ${cashfreeSandboxAppId.substring(0, 15)}...`);
  console.log(`   CASHFREE_SANDBOX_SECRET_KEY = ${cashfreeSandboxSecretKey.substring(0, 15)}...`);
  console.log('   ✅ Sandbox credentials configured');
} else {
  console.log('   ⚠️  Sandbox credentials not configured');
}
console.log();

// Determine which gateway will be used
console.log('4. Active Gateway:');
const activeGateway = paymentGateway || 'razorpay'; // Default from config
console.log(`   ${activeGateway.toUpperCase()} will be used for payments`);

if (activeGateway === 'razorpay') {
  const isDev = process.env.NODE_ENV === 'development';
  const mode = process.env.RAZORPAY_MODE || (isDev ? 'TEST' : 'LIVE');
  console.log(`   Mode: ${mode}`);
  
  if (mode === 'TEST' && (!razorpayTestKeyId || !razorpayTestKeySecret)) {
    console.log('   ⚠️  WARNING: Test mode but test credentials not configured');
    console.log('   Will fall back to main credentials');
  }
  
  if (razorpayKeyId || razorpayTestKeyId) {
    console.log('   ✅ Ready to process payments');
  } else {
    console.log('   ❌ NOT READY: No credentials configured');
  }
} else if (activeGateway === 'cashfree') {
  console.log(`   Environment: ${cashfreeEnv}`);
  
  if (cashfreeEnv === 'SANDBOX' && (!cashfreeSandboxAppId || !cashfreeSandboxSecretKey)) {
    console.log('   ⚠️  WARNING: Sandbox mode but sandbox credentials not configured');
    console.log('   Will fall back to production credentials (may cause errors)');
  }
  
  if (cashfreeAppId || cashfreeSandboxAppId) {
    console.log('   ✅ Ready to process payments');
  } else {
    console.log('   ❌ NOT READY: No credentials configured');
  }
}
console.log();

// Summary
console.log('5. Summary:');
const isConfigured = (activeGateway === 'razorpay' && (razorpayKeyId || razorpayTestKeyId)) ||
                     (activeGateway === 'cashfree' && (cashfreeAppId || cashfreeSandboxAppId));

if (isConfigured) {
  console.log('   ✅ Payment gateway is properly configured');
  console.log(`   ✅ ${activeGateway.toUpperCase()} will handle all payments`);
} else {
  console.log('   ❌ Payment gateway is NOT properly configured');
  console.log('   ❌ Payments will fail');
}

console.log('\n' + '='.repeat(70));
console.log('💡 To switch gateways, edit .env and change PAYMENT_GATEWAY value');
console.log('   Then restart your server');
console.log('='.repeat(70) + '\n');

// Exit with appropriate code
process.exit(isConfigured ? 0 : 1);
