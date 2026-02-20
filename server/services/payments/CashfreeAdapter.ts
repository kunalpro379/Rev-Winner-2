import crypto from "crypto";
import { Cashfree, CFEnvironment, CreateOrderRequest, OrderCreateRefundRequest } from "cashfree-pg";
import {
  IPaymentGateway,
  OrderResult,
  SubscriptionResult,
  PaymentResult,
  RefundResult,
  PaymentStatus,
  CustomerResult,
  CreateOrderOptions,
  CreateSubscriptionOptions,
  CapturePaymentOptions,
  RefundPaymentOptions,
  CreateCustomerOptions,
} from "./IPaymentGateway";

export class CashfreeAdapter implements IPaymentGateway {
  private readonly providerName = "cashfree";
  private initialized: boolean = false;
  private cashfree: Cashfree | null = null;

  constructor(
    private appId: string,
    private secretKey: string,
    private webhookSecret?: string,
    private environment?: CFEnvironment
  ) {
    if (!appId || !secretKey) {
      console.warn("Cashfree credentials not provided. Payment operations will fail.");
    } else {
      // Use provided environment or default to PRODUCTION
      // For localhost development, use SANDBOX mode (set via CASHFREE_ENVIRONMENT env var)
      const env = environment || (process.env.CASHFREE_ENVIRONMENT === 'SANDBOX' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION);
      
      // Validate that credentials match the environment
      const isProdKey = secretKey.includes('_prod_') || secretKey.startsWith('cfsk_ma_prod_');
      const isSandboxKey = secretKey.includes('_test_') || secretKey.includes('_sandbox_') || secretKey.startsWith('cfsk_ma_test_');
      
      if (env === CFEnvironment.SANDBOX && isProdKey && !isSandboxKey) {
        console.error(`[Cashfree] ❌ ERROR: Production credentials detected but using SANDBOX mode!`);
        console.error(`[Cashfree] ❌ This will cause authentication failures.`);
        console.error(`[Cashfree] ❌ Please set CASHFREE_SANDBOX_APP_ID and CASHFREE_SANDBOX_SECRET_KEY in your .env file.`);
      } else if (env === CFEnvironment.PRODUCTION && isSandboxKey && !isProdKey) {
        console.error(`[Cashfree] ❌ ERROR: Sandbox credentials detected but using PRODUCTION mode!`);
        console.error(`[Cashfree] ❌ This will cause authentication failures.`);
      }
      
      this.cashfree = new Cashfree(
        env,
        appId,
        secretKey
      );
      this.initialized = true;
      console.log(`[Cashfree] Initialized in ${env === CFEnvironment.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode (Secret: ${secretKey.substring(0, 15)}...)`);
    }
  }

  getProviderName(): string {
    return this.providerName;
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.cashfree) {
      throw new Error("Cashfree payment gateway is not configured");
    }
  }

  async createOrder(options: CreateOrderOptions): Promise<OrderResult> {
    this.ensureInitialized();

    try {
      const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // WORKAROUND: Cashfree requires HTTPS even in sandbox mode
      // For localhost development, we'll use a dummy HTTPS URL and handle redirect manually
      let returnUrl = options.metadata?.returnUrl || "";
      let notifyUrl = options.metadata?.notifyUrl || "";
      
      // For localhost development in sandbox mode, we need to handle this differently
      const isSandbox = process.env.CASHFREE_ENVIRONMENT === 'SANDBOX';
      const isLocalhost = returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1');
      
      if (isSandbox && isLocalhost) {
        console.log(`[Cashfree] ⚠️  Localhost detected in SANDBOX mode.`);
        console.log(`[Cashfree] ⚠️  Original return URL: ${returnUrl}`);
        console.log(`[Cashfree] ⚠️  Original notify URL: ${notifyUrl}`);
        
        // For sandbox mode with localhost, Cashfree allows HTTP URLs
        // Keep the original URLs but ensure they're properly formatted
        if (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://')) {
          returnUrl = `http://${returnUrl}`;
        }
        if (!notifyUrl.startsWith('http://') && !notifyUrl.startsWith('https://')) {
          notifyUrl = `http://${notifyUrl}`;
        }
        
        console.log(`[Cashfree] ⚠️  Using localhost URLs: return=${returnUrl}, notify=${notifyUrl}`);
      }
      
      const request: CreateOrderRequest = {
        order_amount: options.amount,
        order_currency: options.currency || "USD",
        order_id: orderId,
        customer_details: {
          customer_id: options.metadata?.userId || `cust_${Date.now()}`,
          customer_name: options.customerName || "Customer",
          customer_email: options.customerEmail || "customer@example.com",
          customer_phone: options.customerPhone || "9999999999",
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: notifyUrl,
        },
        order_note: options.receipt || "",
      };

      const response = await this.cashfree!.PGCreateOrder(request);
      
      if (!response.data) {
        throw new Error("Failed to create Cashfree order");
      }

      const order = response.data;

      // Validate that payment_session_id exists
      if (!order.payment_session_id) {
        console.error("❌ [Cashfree] Order created but missing payment_session_id");
        console.error("📋 [Cashfree] Order details:", JSON.stringify(order, null, 2));
        console.error("📋 [Cashfree] Request details:", JSON.stringify(request, null, 2));
        console.error("🔧 [Cashfree] Environment:", this.cashfree ? 'initialized' : 'not initialized');
        console.error("🔧 [Cashfree] App ID:", this.appId);
        console.error("🔧 [Cashfree] Secret Key (first 20 chars):", this.secretKey.substring(0, 20));
        
        // Check if return_url is HTTPS
        const returnUrl = options.metadata?.returnUrl || "";
        if (returnUrl && !returnUrl.startsWith('https://') && !returnUrl.startsWith('http://localhost')) {
          throw new Error(`Cashfree requires HTTPS URLs. Your return_url is: ${returnUrl}. Please set APP_URL environment variable with HTTPS URL.`);
        }
        
        throw new Error("Cashfree order created but payment session ID is missing. This usually means: 1) return_url is not HTTPS (in production), 2) domain not whitelisted in Cashfree dashboard, or 3) credentials mismatch with environment.");
      }

      return {
        orderId: order.order_id || orderId,
        amount: options.amount,
        currency: order.order_currency || options.currency || "USD",
        status: order.order_status || "ACTIVE",
        providerOrderId: order.order_id || orderId,
        paymentSessionId: order.payment_session_id,
        metadata: {
          cashfreeOrder: order,
          paymentSessionId: order.payment_session_id,
          ...options.metadata,
        },
      };
    } catch (error: any) {
      console.error("Cashfree create order error:", error);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        const cashfreeError = error.response.data;
        if (cashfreeError.code === 'order_meta.return_url_invalid') {
          throw new Error(`Cashfree requires HTTPS URLs. Please set APP_URL environment variable with HTTPS URL or use a public development URL (e.g., ngrok). Error: ${cashfreeError.message}`);
        }
        throw new Error(`Cashfree API error: ${cashfreeError.message} (${cashfreeError.code})`);
      }
      
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async createSubscription(options: CreateSubscriptionOptions): Promise<SubscriptionResult> {
    this.ensureInitialized();

    try {
      throw new Error("Cashfree subscriptions are handled differently - use createOrder for recurring payments");
    } catch (error: any) {
      console.error("Cashfree create subscription error:", error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async capturePayment(options: CapturePaymentOptions): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      const response = await this.cashfree!.PGOrderFetchPayments(options.paymentId);
      
      if (!response.data || response.data.length === 0) {
        throw new Error("Payment not found");
      }

      const payment = response.data[0];

      return {
        paymentId: payment.cf_payment_id?.toString() || options.paymentId,
        orderId: payment.order_id,
        amount: payment.payment_amount || 0,
        currency: payment.payment_currency || "USD",
        status: payment.payment_status || "UNKNOWN",
        providerPaymentId: payment.cf_payment_id?.toString() || options.paymentId,
        method: payment.payment_group || undefined,
        capturedAt: payment.payment_completion_time ? new Date(payment.payment_completion_time) : new Date(),
        metadata: {
          cashfreePayment: payment,
        },
      };
    } catch (error: any) {
      console.error("Cashfree capture payment error:", error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  async refundPayment(options: RefundPaymentOptions): Promise<RefundResult> {
    this.ensureInitialized();

    try {
      const refundId = `refund_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      const request: OrderCreateRefundRequest = {
        refund_amount: options.amount || 0,
        refund_id: refundId,
        refund_note: options.reason || "Refund requested",
      };

      const response = await this.cashfree!.PGOrderCreateRefund(options.paymentId, request);
      
      if (!response.data) {
        throw new Error("Failed to create refund");
      }

      const refund = response.data;

      return {
        refundId: refund.refund_id || refundId,
        paymentId: options.paymentId,
        amount: refund.refund_amount || options.amount || 0,
        currency: refund.refund_currency || "USD",
        status: refund.refund_status || "pending",
        providerRefundId: refund.cf_refund_id?.toString() || refundId,
        reason: options.reason,
        metadata: {
          cashfreeRefund: refund,
        },
      };
    } catch (error: any) {
      console.error("Cashfree refund payment error:", error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean {
    try {
      const webhookSecret = secret || this.webhookSecret;
      if (!webhookSecret) {
        throw new Error("Webhook secret not configured");
      }

      const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyString)
        .digest("base64");

      return expectedSignature === signature;
    } catch (error: any) {
      console.error("Cashfree webhook verification error:", error);
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    this.ensureInitialized();

    try {
      const response = await this.cashfree!.PGFetchOrder(paymentId);
      
      if (!response.data) {
        throw new Error("Order not found");
      }

      const order = response.data;

      return {
        paymentId: order.order_id || paymentId,
        status: order.order_status || "UNKNOWN",
        amount: order.order_amount || 0,
        currency: order.order_currency || "USD",
        method: undefined,
        errorCode: undefined,
        errorDescription: undefined,
        metadata: {
          cashfreeOrder: order,
        },
      };
    } catch (error: any) {
      console.error("Cashfree get payment status error:", error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async createCustomer(options: CreateCustomerOptions): Promise<CustomerResult> {
    const customerId = `cust_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return {
      customerId: customerId,
      providerCustomerId: customerId,
      email: options.email,
      name: options.name,
      metadata: {
        ...options.metadata,
      },
    };
  }

  validateWebhookPayload(payload: any): boolean {
    try {
      return !!(payload && payload.type && payload.data);
    } catch (error) {
      return false;
    }
  }

  parseWebhookEvent(payload: any): {
    eventType: string;
    entity: any;
    metadata?: Record<string, any>;
  } {
    try {
      return {
        eventType: payload.type || payload.event,
        entity: payload.data || payload,
        metadata: {
          eventTime: payload.event_time,
          version: payload.version,
        },
      };
    } catch (error) {
      throw new Error("Failed to parse webhook event");
    }
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + paymentId;
      const expectedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(body)
        .digest("base64");

      return expectedSignature === signature;
    } catch (error: any) {
      console.error("Cashfree payment signature verification error:", error);
      return false;
    }
  }
}
