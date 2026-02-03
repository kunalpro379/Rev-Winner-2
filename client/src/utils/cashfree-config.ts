/**
 * Cashfree Configuration Utility
 * Provides consistent configuration for Cashfree payments with all payment methods enabled
 */

export interface CashfreeOptions {
  appId: string;
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
  paymentModes?: string;
}

/**
 * Create Cashfree configuration with ALL payment methods enabled
 */
export function createCashfreeConfig(options: CashfreeOptions) {
  const isTestMode = options.appId.includes('TEST') || options.appId.startsWith('TEST');
  
  const baseConfig = {
    ...options,
    
    // Enable ALL payment methods for Cashfree
    paymentModes: options.paymentModes || [
      'cc',        // Credit Cards
      'dc',        // Debit Cards
      'nb',        // Net Banking
      'upi',       // UPI
      'wallet',    // Wallets
      'paypal',    // PayPal
      'emi',       // EMI
      'paylater'   // Pay Later
    ].join(','),
    
    // Enhanced theme
    theme: '#6366f1',
    
    // Auto-redirect after payment
    redirect: true,
  };

  console.log('Opening Cashfree checkout with config:', {
    mode: isTestMode ? 'TEST' : 'PRODUCTION',
    amount: baseConfig.orderAmount,
    currency: baseConfig.orderCurrency,
    orderId: baseConfig.orderId,
    methods_enabled: baseConfig.paymentModes
  });

  return baseConfig;
}

/**
 * Open Cashfree checkout with enhanced configuration
 */
export function openCashfreeCheckout(config: CashfreeOptions) {
  const enhancedConfig = createCashfreeConfig(config);
  
  // Ensure Cashfree is loaded
  if (typeof window.Cashfree === 'undefined') {
    throw new Error('Cashfree SDK not loaded. Please include the Cashfree script.');
  }
  
  const cashfree = new window.Cashfree(enhancedConfig);
  cashfree.redirect();
  
  return cashfree;
}