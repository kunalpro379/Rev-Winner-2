/**
 * Enhanced Razorpay Configuration Utility
 * Provides consistent configuration across all payment components with all payment methods enabled
 * Optimized for TEST mode to show all available payment options
 */

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
    confirm_close?: boolean;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
}

/**
 * Create enhanced Razorpay configuration with ALL payment methods enabled for TEST mode
 * Uses aggressive configuration to force all methods to show
 */
export function createRazorpayConfig(options: RazorpayOptions) {
  // Determine if we're in test mode
  const isTestMode = options.key.includes('test') || options.key.startsWith('rzp_test');
  
  const baseConfig = {
    ...options,
    
    // Enhanced modal configuration for better UX
    modal: {
      ondismiss: options.modal?.ondismiss || (() => {}),
      escape: true,
      backdropclose: false,
      confirm_close: true,
      animation: true,
      ...options.modal
    },
    
    // Enhanced theme with Rev Winner branding
    theme: {
      color: '#6366f1',
      backdrop_color: 'rgba(0, 0, 0, 0.6)',
      ...options.theme
    },
    
    // Retry configuration for failed payments
    retry: {
      enabled: true,
      max_count: 3
    },
    
    // Timeout configuration (15 minutes)
    timeout: 900,
    
    // Remember customer preference for faster checkout
    remember_customer: true,
    
    // Enable international payments
    allow_rotation: true,
  };

  // AGGRESSIVE configuration for TEST mode to force all methods
  if (isTestMode) {
    return {
      ...baseConfig,
      
      // Force enable ALL payment methods - remove restrictions
      method: {
        netbanking: true,
        card: true,
        wallet: true,
        upi: true,
        paylater: true,
        cardless_emi: true,
        emi: true,
        bank_transfer: true,
        qr: true,
        nach: false, // Keep disabled as it's for recurring payments
        fpx: false,  // Keep disabled as it's for Malaysia
      },
      
      // Additional configurations to force all methods
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay using Net Banking',
              instruments: [
                {
                  method: 'netbanking',
                  banks: ['HDFC', 'ICICI', 'AXIS', 'SBI', 'KOTAK', 'YES', 'IDBI', 'FEDERAL', 'CANARA', 'BOB', 'UNION', 'INDIAN', 'PNB', 'CENTRAL', 'SYNDICATE', 'ORIENTAL', 'ALLAHABAD', 'ANDHRA', 'CORPORATION', 'VIJAYA', 'DENA', 'UCO', 'KARNATAKA', 'PUNJAB_AND_SIND', 'SOUTH_INDIAN', 'INDIAN_OVERSEAS', 'CITY_UNION', 'CATHOLIC_SYRIAN', 'TAMILNAD_MERCANTILE', 'KARUR_VYSYA', 'LAKSHMI_VILAS', 'NAINITAL', 'RATNAKAR', 'RBL', 'SHAMRAO_VITHAL', 'BASSEIN_CATHOLIC', 'DHANLAXMI', 'JANATA_SAHAKARI', 'KALYAN_JANATA_SAHAKARI', 'MEHSANA_URBAN', 'NKGSB', 'SARASWAT', 'EQUITAS_SMALL_FINANCE', 'ESAF_SMALL_FINANCE', 'FINCARE_SMALL_FINANCE', 'JANA_SMALL_FINANCE', 'NORTH_EAST_SMALL_FINANCE', 'SURYODAY_SMALL_FINANCE', 'UJJIVAN_SMALL_FINANCE', 'UTKARSH_SMALL_FINANCE']
                }
              ]
            },
            wallets: {
              name: 'Pay using Wallets',
              instruments: [
                {
                  method: 'wallet',
                  wallets: ['paytm', 'mobikwik', 'olamoney', 'freecharge', 'jiomoney', 'amazonpay', 'phonepe']
                }
              ]
            },
            upi: {
              name: 'Pay using UPI',
              instruments: [
                {
                  method: 'upi',
                  flows: ['collect', 'intent', 'qr']
                }
              ]
            },
            paylater: {
              name: 'Pay Later',
              instruments: [
                {
                  method: 'paylater',
                  providers: ['getsimpl', 'icici', 'lazypay', 'olamoney', 'epaylater']
                }
              ]
            },
            emi: {
              name: 'EMI',
              instruments: [
                {
                  method: 'emi',
                  issuers: ['HDFC', 'ICICI', 'AXIS', 'SBI', 'KOTAK', 'YES', 'IDBI', 'FEDERAL', 'CANARA', 'BOB']
                }
              ]
            },
            cardless_emi: {
              name: 'Cardless EMI',
              instruments: [
                {
                  method: 'cardless_emi',
                  providers: ['zestmoney', 'flexipay', 'walnut369', 'sezzle', 'tvscredit']
                }
              ]
            }
          },
          sequence: ['block.banks', 'block.wallets', 'block.upi', 'block.paylater', 'block.emi', 'block.cardless_emi'],
          preferences: {
            show_default_blocks: true
          }
        }
      }
    };
  } else {
    // Production mode - use standard configuration
    return {
      ...baseConfig,
      
      // Standard payment methods for production
      method: {
        netbanking: true,
        card: true,
        wallet: true,
        upi: true,
        paylater: true,
        cardless_emi: false,
        emi: true,
        bank_transfer: false,
        qr: true,
        nach: false,
        fpx: false,
      }
    };
  }
}

/**
 * Enhanced payment handler with proper GPay redirection and error handling
 */
export function createPaymentHandler(
  verifyEndpoint: string,
  orderId: string,
  accessToken: string,
  onSuccess: () => void,
  onError: (error: string) => void
) {
  return async function (response: any) {
    try {
      console.log('🔄 Payment handler called with response:', {
        payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
        signature: response.razorpay_signature ? 'present' : 'missing'
      });

      const verifyResponse = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log('✅ Payment verification response:', { 
        status: verifyResponse.status, 
        success: verifyResponse.ok 
      });

      if (verifyResponse.ok) {
        // Call success callback first
        onSuccess();
        
        // Enhanced redirection handling for GPay and other payment methods
        setTimeout(() => {
          try {
            // Force close any open Razorpay modals
            const razorpayContainer = document.querySelector('.razorpay-container');
            const razorpayBackdrop = document.querySelector('.razorpay-backdrop');
            const razorpayModal = document.querySelector('[data-razorpay-checkout-frame]');
            const razorpayOverlay = document.querySelector('.razorpay-overlay');
            
            // Hide all Razorpay elements
            [razorpayContainer, razorpayBackdrop, razorpayModal, razorpayOverlay].forEach(el => {
              if (el) {
                (el as HTMLElement).style.display = 'none';
                (el as HTMLElement).style.visibility = 'hidden';
                (el as HTMLElement).style.opacity = '0';
              }
            });
            
            // Remove any Razorpay elements from DOM
            document.querySelectorAll('[class*="razorpay"], [id*="razorpay"]').forEach(el => {
              try {
                el.remove();
              } catch (e) {
                // Ignore removal errors
              }
            });
            
            console.log('🔄 Razorpay modal cleanup completed, refreshing page...');
            
            // Force page refresh to show updated data and ensure clean state
            window.location.reload();
          } catch (cleanupError) {
            console.warn('⚠️ Modal cleanup error (non-critical):', cleanupError);
            // Still refresh the page even if cleanup fails
            window.location.reload();
          }
        }, 2000); // Increased delay to ensure payment processing completes
        
      } else {
        onError(verifyData.message || "Payment verification failed.");
      }
    } catch (error: any) {
      console.error('❌ Payment handler error:', error);
      onError(error.message || "Failed to verify payment.");
    }
  };
}

/**
 * Open Razorpay checkout with enhanced configuration and error handling
 * Optimized for TEST mode to show all payment methods
 */
export function openRazorpayCheckout(config: RazorpayOptions) {
  const enhancedConfig = createRazorpayConfig(config);
  
  // Ensure Razorpay is loaded
  if (typeof window.Razorpay === 'undefined') {
    throw new Error('Razorpay SDK not loaded. Please include the Razorpay script.');
  }
  
  const isTestMode = config.key.includes('test') || config.key.startsWith('rzp_test');
  
  console.log('🚀 Opening Razorpay checkout with enhanced config:', {
    mode: isTestMode ? 'TEST' : 'PRODUCTION',
    amount: enhancedConfig.amount,
    currency: enhancedConfig.currency,
    order_id: enhancedConfig.order_id,
    methods_enabled: enhancedConfig.method ? Object.keys(enhancedConfig.method).filter(k => enhancedConfig.method[k]) : 'all'
  });
  
  // For TEST mode, add additional debugging
  if (isTestMode) {
    console.log('🧪 TEST MODE: All payment methods should be visible');
    console.log('💡 If only cards are showing, check Razorpay dashboard settings');
  }
  
  const razorpay = new window.Razorpay(enhancedConfig);
  
  // Enhanced error handling for payment failures
  razorpay.on('payment.failed', function (response: any) {
    console.error('💳 Payment failed:', response.error);
    
    // Show user-friendly error message
    const errorCode = response.error?.code;
    const errorDescription = response.error?.description;
    
    let userMessage = "Payment failed. Please try again.";
    
    if (errorCode === 'BAD_REQUEST_ERROR') {
      userMessage = "Invalid payment details. Please check and try again.";
    } else if (errorCode === 'GATEWAY_ERROR') {
      userMessage = "Payment gateway error. Please try a different payment method.";
    } else if (errorCode === 'NETWORK_ERROR') {
      userMessage = "Network error. Please check your connection and try again.";
    } else if (errorDescription) {
      userMessage = errorDescription;
    }
    
    // Call the error handler if available
    if (config.modal?.ondismiss) {
      config.modal.ondismiss();
    }
  });
  
  // Handle successful modal open
  razorpay.on('payment.authorized', function (response: any) {
    console.log('✅ Payment authorized:', response);
  });
  
  razorpay.open();
  
  return razorpay;
}