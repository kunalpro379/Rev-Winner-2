/// <reference types="vite/client" />

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface Razorpay {
  new (options: RazorpayOptions): {
    open: () => void;
    on: (event: string, handler: (response: any) => void) => void;
  };
}

// Cashfree types
interface CashfreeCheckoutOptions {
  paymentSessionId: string;
  returnUrl?: string;
  redirectTarget?: string;
}

interface CashfreeInstance {
  checkout: (options: CashfreeCheckoutOptions) => Promise<any>;
}

interface CashfreeConstructor {
  (config: { mode: 'sandbox' | 'production' }): CashfreeInstance;
}

// Extend Window interface
interface Window {
  Razorpay: Razorpay;
  Cashfree: CashfreeConstructor;
}
