import { IPaymentGateway } from "./IPaymentGateway";
import { CashfreeAdapter } from "./CashfreeAdapter";
import { RazorpayAdapter } from "./RazorpayAdapter";
import { CFEnvironment } from "cashfree-pg";
import { DEFAULT_PAYMENT_GATEWAY } from "../../config/payment.config";

export type PaymentGatewayProvider = "cashfree" | "stripe" | "razorpay";

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider;
  credentials: {
    appId?: string;
    secretKey?: string;
    webhookSecret?: string;
    publicKey?: string;
  };
}

export class PaymentGatewayFactory {
  private static instances = new Map<string, IPaymentGateway>();
  private static defaultProvider: PaymentGatewayProvider = DEFAULT_PAYMENT_GATEWAY;

  static setDefaultProvider(provider: PaymentGatewayProvider): void {
    this.defaultProvider = provider;
  }

  static getDefaultProvider(): PaymentGatewayProvider {
    return this.defaultProvider;
  }

  static getGateway(provider?: PaymentGatewayProvider): IPaymentGateway {
    const providerName = provider || this.defaultProvider;
    
    // For Cashfree, always recreate the gateway to ensure correct credentials are used
    // (environment might have changed or credentials updated)
    if (providerName === "cashfree") {
      // Clear cache for cashfree to ensure fresh instance with correct credentials
      this.instances.delete(providerName);
    }
    
    if (this.instances.has(providerName)) {
      return this.instances.get(providerName)!;
    }

    const gateway = this.createGateway(providerName);
    this.instances.set(providerName, gateway);
    return gateway;
  }

  private static createGateway(provider: PaymentGatewayProvider): IPaymentGateway {
    switch (provider) {
      case "cashfree":
        // Determine Cashfree environment:
        // 1. If CASHFREE_ENVIRONMENT is explicitly set, use that
        // 2. For localhost development, use SANDBOX to avoid domain whitelisting
        // 3. Otherwise, use PRODUCTION
        let cashfreeEnv = CFEnvironment.PRODUCTION;
        if (process.env.CASHFREE_ENVIRONMENT === 'SANDBOX') {
          cashfreeEnv = CFEnvironment.SANDBOX;
          console.log(`[PaymentGatewayFactory] Using SANDBOX mode (CASHFREE_ENVIRONMENT=SANDBOX)`);
        } else if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
          cashfreeEnv = CFEnvironment.PRODUCTION;
          console.log(`[PaymentGatewayFactory] Using PRODUCTION mode (CASHFREE_ENVIRONMENT=PRODUCTION)`);
        } else {
          // Auto-detect: Use SANDBOX for localhost/development to avoid whitelisting requirements
          // Check if we're likely running in localhost (development)
          const isLocalhost = !process.env.APP_URL || 
            process.env.APP_URL.includes('localhost') || 
            process.env.APP_URL.includes('127.0.0.1') ||
            process.env.NODE_ENV === 'development';
          cashfreeEnv = isLocalhost ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
          console.log(`[PaymentGatewayFactory] Auto-detected ${cashfreeEnv === CFEnvironment.SANDBOX ? 'SANDBOX' : 'PRODUCTION'} mode (NODE_ENV=${process.env.NODE_ENV}, APP_URL=${process.env.APP_URL || 'not set'})`);
        }
        
        // Use sandbox credentials if in sandbox mode and available, otherwise use main credentials
        // Sandbox credentials: CASHFREE_SANDBOX_APP_ID, CASHFREE_SANDBOX_SECRET_KEY
        // Production credentials: CASHFREE_APP_ID, CASHFREE_SECRET_KEY
        let appId: string;
        let secretKey: string;
        let webhookSecret: string | undefined;
        
        if (cashfreeEnv === CFEnvironment.SANDBOX) {
          // Prefer sandbox-specific credentials
          const sandboxAppId = process.env.CASHFREE_SANDBOX_APP_ID;
          const sandboxSecretKey = process.env.CASHFREE_SANDBOX_SECRET_KEY;
          
          if (sandboxAppId && sandboxSecretKey) {
            // Use sandbox credentials
            appId = sandboxAppId;
            secretKey = sandboxSecretKey;
            webhookSecret = process.env.CASHFREE_SANDBOX_WEBHOOK_SECRET || process.env.CASHFREE_WEBHOOK_SECRET;
            console.log(`[PaymentGatewayFactory] Using sandbox-specific credentials (App ID: ${appId.substring(0, 10)}...)`);
          } else {
            // Fall back to production credentials but warn
            appId = process.env.CASHFREE_APP_ID || "";
            secretKey = process.env.CASHFREE_SECRET_KEY || "";
            webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
            
            if (appId && secretKey) {
              console.warn(`[PaymentGatewayFactory] ⚠️  WARNING: Using PRODUCTION credentials for SANDBOX mode. This will cause authentication errors!`);
              console.warn(`[PaymentGatewayFactory] ⚠️  Please set CASHFREE_SANDBOX_APP_ID and CASHFREE_SANDBOX_SECRET_KEY in your .env file.`);
              console.warn(`[PaymentGatewayFactory] ⚠️  You can get sandbox credentials from: https://merchant.cashfree.com (switch to Test/Sandbox mode)`);
            }
          }
        } else {
          // Production mode - use production credentials
          appId = process.env.CASHFREE_APP_ID || "";
          secretKey = process.env.CASHFREE_SECRET_KEY || "";
          webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
          console.log(`[PaymentGatewayFactory] Using production credentials (App ID: ${appId.substring(0, 10)}...)`);
        }
        
        return new CashfreeAdapter(
          appId,
          secretKey,
          webhookSecret,
          cashfreeEnv
        );

      case "razorpay":
        // Determine Razorpay environment (similar to Cashfree logic)
        // Check for explicit RAZORPAY_MODE setting or auto-detect based on NODE_ENV
        let razorpayKeyId: string;
        let razorpayKeySecret: string;
        let razorpayWebhookSecret: string | undefined;
        let razorpayMode = "LIVE"; // default to live
        
        // Check if RAZORPAY_MODE is explicitly set
        if (process.env.RAZORPAY_MODE === 'TEST') {
          razorpayMode = "TEST";
          console.log(`[PaymentGatewayFactory] Using Razorpay TEST mode (RAZORPAY_MODE=TEST)`);
        } else if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
          razorpayMode = "LIVE";
          console.log(`[PaymentGatewayFactory] Using Razorpay LIVE mode (RAZORPAY_MODE=${process.env.RAZORPAY_MODE})`);
        } else {
          // Auto-detect: Use TEST for localhost/development environments
          const isLocalhost = !process.env.APP_URL || 
            process.env.APP_URL.includes('localhost') || 
            process.env.APP_URL.includes('127.0.0.1') ||
            process.env.NODE_ENV === 'development';
          razorpayMode = isLocalhost ? "TEST" : "LIVE";
          console.log(`[PaymentGatewayFactory] Auto-detected Razorpay ${razorpayMode} mode (NODE_ENV=${process.env.NODE_ENV}, APP_URL=${process.env.APP_URL || 'not set'})`);
        }
        
        // Select credentials based on mode
        if (razorpayMode === "TEST") {
          // Prefer test-specific credentials
          const testKeyId = process.env.RAZORPAY_TEST_KEY_ID;
          const testKeySecret = process.env.RAZORPAY_TEST_KEY_SECRET;
          
          if (testKeyId && testKeySecret) {
            // Use test credentials
            razorpayKeyId = testKeyId;
            razorpayKeySecret = testKeySecret;
            razorpayWebhookSecret = process.env.RAZORPAY_TEST_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
            console.log(`[PaymentGatewayFactory] Using test-specific credentials (Key ID: ${razorpayKeyId.substring(0, 15)}...)`);
          } else {
            // Fall back to main credentials but warn
            razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
            razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
            razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            
            if (razorpayKeyId && razorpayKeySecret) {
              console.warn(`[PaymentGatewayFactory] ⚠️  WARNING: Using main credentials for TEST mode.`);
              console.warn(`[PaymentGatewayFactory] ⚠️  Please set RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in your .env file.`);
              console.warn(`[PaymentGatewayFactory] ⚠️  You can get test credentials from: https://dashboard.razorpay.com/app/keys (Test mode)`);
            }
          }
        } else {
          // LIVE mode - use live credentials
          razorpayKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
          razorpayKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
          razorpayWebhookSecret = process.env.RAZORPAY_LIVE_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
          console.log(`[PaymentGatewayFactory] Using live credentials (Key ID: ${razorpayKeyId.substring(0, 15)}...)`);
        }
        
        if (!razorpayKeyId || !razorpayKeySecret) {
          console.error(`[PaymentGatewayFactory] ❌ Razorpay credentials not configured for ${razorpayMode} mode`);
          console.error(`[PaymentGatewayFactory]    Please add these to your .env file:`);
          if (razorpayMode === "TEST") {
            console.error(`[PaymentGatewayFactory]    RAZORPAY_TEST_KEY_ID=rzp_test_xxxxx`);
            console.error(`[PaymentGatewayFactory]    RAZORPAY_TEST_KEY_SECRET=xxxxx`);
          } else {
            console.error(`[PaymentGatewayFactory]    RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxx`);
            console.error(`[PaymentGatewayFactory]    RAZORPAY_LIVE_KEY_SECRET=xxxxx`);
          }
          console.error(`[PaymentGatewayFactory]    Get credentials from: https://dashboard.razorpay.com/app/keys`);
        }
        
        return new RazorpayAdapter(razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret);

      case "stripe":
        throw new Error("Stripe payment gateway not implemented yet");

      default:
        throw new Error(`Unsupported payment gateway: ${provider}`);
    }
  }

  static createCustomGateway(config: PaymentGatewayConfig): IPaymentGateway {
    switch (config.provider) {
      case "cashfree":
        const customCashfreeEnv = process.env.CASHFREE_ENVIRONMENT === 'SANDBOX' 
          ? CFEnvironment.SANDBOX 
          : CFEnvironment.PRODUCTION;
        return new CashfreeAdapter(
          config.credentials.appId || "",
          config.credentials.secretKey || "",
          config.credentials.webhookSecret,
          customCashfreeEnv
        );

      case "razorpay":
        return new RazorpayAdapter(
          config.credentials.publicKey || "",
          config.credentials.secretKey || ""
        );

      case "stripe":
        throw new Error("Stripe payment gateway not implemented yet");

      default:
        throw new Error(`Unsupported payment gateway: ${config.provider}`);
    }
  }

  static clearCache(): void {
    this.instances.clear();
  }

  static hasProvider(provider: PaymentGatewayProvider): boolean {
    return this.instances.has(provider);
  }
}
