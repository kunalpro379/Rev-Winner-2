/**
 * Unified Payment Gateway Utility
 * Automatically switches between Razorpay and Cashfree based on configuration
 */

import { openRazorpayCheckout, createPaymentHandler, RazorpayOptions } from './razorpay-config';
import { openCashfreeCheckout, CashfreeOptions } from './cashfree-config';

export interface UnifiedPaymentOptions {
  gateway: 'razorpay' | 'cashfree';
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  verifyEndpoint: string;
  accessToken: string;
}

/**
 * Get payment gateway configuration from environment
 */
export async function getPaymentGatewayConfig(): Promise<{
  gateway: 'razorpay' | 'cashfree';
  keyId: string;
  environment: string;
}> {
  try {
    const response = await fetch('/api/payment/config');
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Failed to get payment config:', error);
    // Fallback to Razorpay
    return {
      gateway: 'razorpay',
      keyId: 'rzp_test_default',
      environment: 'TEST'
    };
  }
}

/**
 * Open payment checkout with the configured gateway
 */
export async function openPaymentCheckout(options: UnifiedPaymentOptions) {
  const config = await getPaymentGatewayConfig();
  
  console.log(`💳 Using ${config.gateway.toUpperCase()} payment gateway`);
  
  if (config.gateway === 'razorpay') {
    return openRazorpayPayment(options, config.keyId);
  } else if (config.gateway === 'cashfree') {
    return openCashfreePayment(options, config.keyId);
  } else {
    throw new Error(`Unsupported payment gateway: ${config.gateway}`);
  }
}

/**
 * Open Razorpay payment with all methods enabled
 */
function openRazorpayPayment(options: UnifiedPaymentOptions, keyId: string) {
  const razorpayOptions: RazorpayOptions = {
    key: keyId,
    amount: options.amount,
    currency: options.currency,
    name: "Rev Winner",
    description: options.description,
    order_id: options.orderId,
    handler: createPaymentHandler(
      options.verifyEndpoint,
      options.orderId,
      options.accessToken,
      options.onSuccess,
      options.onError
    ),
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone,
    },
    theme: {
      color: '#6366f1',
    },
    modal: {
      ondismiss: () => {
        console.log('Payment modal dismissed');
      }
    }
  };

  return openRazorpayCheckout(razorpayOptions);
}

/**
 * Open Cashfree payment with all methods enabled
 */
function openCashfreePayment(options: UnifiedPaymentOptions, appId: string) {
  const cashfreeOptions: CashfreeOptions = {
    appId: appId,
    orderId: options.orderId,
    orderAmount: options.amount / 100, // Cashfree uses rupees, not paise
    orderCurrency: options.currency,
    customerName: options.customerName,
    customerEmail: options.customerEmail,
    customerPhone: options.customerPhone || '',
    returnUrl: `${window.location.origin}/payment/success`,
    notifyUrl: options.verifyEndpoint,
  };

  return openCashfreeCheckout(cashfreeOptions);
}

/**
 * Verify payment based on gateway
 */
export async function verifyPayment(
  gateway: 'razorpay' | 'cashfree',
  paymentData: any,
  verifyEndpoint: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        gateway,
        ...paymentData
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}