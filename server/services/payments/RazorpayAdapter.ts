import Razorpay from "razorpay";
import crypto from "crypto";
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

export class RazorpayAdapter implements IPaymentGateway {
  private razorpay: Razorpay | null;
  private readonly providerName = "razorpay";

  constructor(
    private keyId: string,
    private keySecret: string,
    private webhookSecret?: string
  ) {
    if (!keyId || !keySecret) {
      console.error("❌ Razorpay credentials not provided. Payment operations will fail.");
      console.error("   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file");
      console.error("   You can get credentials from: https://dashboard.razorpay.com/app/keys");
      this.razorpay = null;
    } else {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        console.log(`Razorpay initialized successfully (Key ID: ${keyId.substring(0, 10)}...)`);
      } catch (error: any) {
        console.error("❌ Failed to initialize Razorpay:", error.message);
        this.razorpay = null;
      }
    }
  }

  getProviderName(): string {
    return this.providerName;
  }

  private ensureInitialized(): Razorpay {
    if (!this.razorpay) {
      throw new Error(
        "Razorpay payment gateway is not configured. " +
        "Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file. " +
        "Get credentials from: https://dashboard.razorpay.com/app/keys"
      );
    }
    return this.razorpay;
  }

  async createOrder(options: CreateOrderOptions): Promise<OrderResult> {
    const razorpay = this.ensureInitialized();

    try {
      // Razorpay expects amount in smallest currency unit (paise for INR, cents for USD)
      const amountInSmallestUnit = Math.round(options.amount * 100);
      const currency = options.currency || "USD";
      
      console.log(`[Razorpay] Creating order: amount=${amountInSmallestUnit}, currency=${currency}, receipt=${options.receipt}`);

      const order = await razorpay.orders.create({
        amount: amountInSmallestUnit,
        currency: currency,
        receipt: options.receipt,
        notes: options.notes || {},
      });

      console.log(`[Razorpay] Order created successfully: orderId=${order.id}, status=${order.status}, currency=${order.currency}`);

      return {
        orderId: order.id,
        amount: options.amount,
        currency: order.currency,
        status: order.status,
        providerOrderId: order.id,
        metadata: {
          razorpayOrder: order,
          ...options.metadata,
        },
      };
    } catch (error: any) {
      console.error("Razorpay create order error:", error);
      
      // Provide more specific error messages
      if (error.statusCode === 401 || error.error?.code === 'BAD_REQUEST_ERROR') {
        const authError = error.error?.description || error.message;
        if (authError?.toLowerCase().includes('authentication')) {
          throw new Error(
            'Razorpay authentication failed. Please verify your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file. ' +
            'Get valid credentials from: https://dashboard.razorpay.com/app/keys'
          );
        }
      }
      
      if (error.error?.description?.includes('currency') || error.error?.code === 'BAD_REQUEST_CURRENCY') {
        throw new Error(`Currency ${options.currency || "USD"} is not supported by your Razorpay account. Please enable USD in your Razorpay dashboard.`);
      }
      
      throw new Error(`Failed to create Razorpay order: ${error.error?.description || error.message || 'Unknown error'}`);
    }
  }

  async createSubscription(options: CreateSubscriptionOptions): Promise<SubscriptionResult> {
    const razorpay = this.ensureInitialized();

    try {
      if (!options.customerId) {
        throw new Error("Customer ID is required for subscription creation");
      }

      // Type assertion needed due to Razorpay SDK typing issues
      const subscription: any = await razorpay.subscriptions.create({
        plan_id: options.planId,
        customer_id: options.customerId,
        customer_notify: 1,
        total_count: options.totalCount || 12,
        quantity: options.quantity || 1,
        start_at: options.startAt ? Math.floor(options.startAt.getTime() / 1000) : undefined,
        expire_by: options.expireBy ? Math.floor(options.expireBy.getTime() / 1000) : undefined,
        notes: options.notes || {},
      } as any);

      return {
        subscriptionId: subscription.id,
        planId: options.planId,
        customerId: options.customerId,
        status: subscription.status,
        providerSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : undefined,
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined,
        metadata: {
          razorpaySubscription: subscription,
          ...options.metadata,
        },
      };
    } catch (error: any) {
      console.error("Razorpay create subscription error:", error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async capturePayment(options: CapturePaymentOptions): Promise<PaymentResult> {
    const razorpay = this.ensureInitialized();

    try {
      // First fetch the payment to check status
      const fetchedPayment = await razorpay.payments.fetch(options.paymentId);

      // If already captured, return the existing payment
      if (fetchedPayment.captured) {
        return {
          paymentId: fetchedPayment.id,
          orderId: fetchedPayment.order_id || undefined,
          amount: Number(fetchedPayment.amount || 0) / 100,
          currency: fetchedPayment.currency,
          status: fetchedPayment.status,
          providerPaymentId: fetchedPayment.id,
          method: fetchedPayment.method || undefined,
          capturedAt: new Date(fetchedPayment.created_at * 1000),
          metadata: {
            razorpayPayment: fetchedPayment,
          },
        };
      }

      // Capture the authorized payment
      const captureAmount = options.amount 
        ? Math.round(options.amount * 100) 
        : fetchedPayment.amount;

      const payment = await razorpay.payments.capture(
        options.paymentId,
        captureAmount,
        options.currency || fetchedPayment.currency
      );

      return {
        paymentId: payment.id,
        orderId: payment.order_id || undefined,
        amount: Number(payment.amount || 0) / 100,
        currency: payment.currency,
        status: payment.status,
        providerPaymentId: payment.id,
        method: payment.method || undefined,
        capturedAt: new Date(),
        metadata: {
          razorpayPayment: payment,
        },
      };
    } catch (error: any) {
      console.error("Razorpay capture payment error:", error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  async refundPayment(options: RefundPaymentOptions): Promise<RefundResult> {
    const razorpay = this.ensureInitialized();

    try {
      const refundAmount = options.amount ? Math.round(options.amount * 100) : undefined;

      const refund = await razorpay.payments.refund(options.paymentId, {
        amount: refundAmount,
        notes: options.notes || {},
      });

      return {
        refundId: refund.id,
        paymentId: options.paymentId,
        amount: (refund.amount || 0) / 100,
        currency: refund.currency || "USD",
        status: refund.status || "pending",
        providerRefundId: refund.id,
        reason: options.reason,
        metadata: {
          razorpayRefund: refund,
        },
      };
    } catch (error: any) {
      console.error("Razorpay refund payment error:", error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * IMPORTANT: payload must be the raw request body string, NOT the parsed JSON object
   * Use Express middleware to access raw body: app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString() } }))
   * Then call: verifyWebhookSignature(req.rawBody, signature)
   */
  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean {
    try {
      const webhookSecret = secret || this.webhookSecret;
      if (!webhookSecret) {
        throw new Error("Webhook secret not configured");
      }

      // If payload is an object, convert to string (for backward compatibility)
      // But this is NOT recommended - use raw body for proper verification
      const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyString)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error: any) {
      console.error("Razorpay webhook verification error:", error);
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const razorpay = this.ensureInitialized();

    try {
      const payment = await razorpay.payments.fetch(paymentId);

      return {
        paymentId: payment.id,
        status: payment.status,
        amount: Number(payment.amount || 0) / 100,
        currency: payment.currency,
        method: payment.method || undefined,
        errorCode: payment.error_code || undefined,
        errorDescription: payment.error_description || undefined,
        metadata: {
          razorpayPayment: payment,
        },
      };
    } catch (error: any) {
      console.error("Razorpay get payment status error:", error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async createCustomer(options: CreateCustomerOptions): Promise<CustomerResult> {
    const razorpay = this.ensureInitialized();

    try {
      const customer = await razorpay.customers.create({
        name: options.name,
        email: options.email,
        contact: options.phone,
        notes: options.notes || {},
      });

      return {
        customerId: customer.id,
        providerCustomerId: customer.id,
        email: customer.email || options.email,
        name: customer.name || options.name,
        metadata: {
          razorpayCustomer: customer,
          ...options.metadata,
        },
      };
    } catch (error: any) {
      console.error("Razorpay create customer error:", error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  validateWebhookPayload(payload: any): boolean {
    try {
      // Basic validation - ensure required fields exist
      return !!(payload && payload.event && payload.payload);
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
        eventType: payload.event,
        entity: payload.payload?.payment?.entity || payload.payload?.order?.entity || payload.payload,
        metadata: {
          accountId: payload.account_id,
          contains: payload.contains,
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
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error: any) {
      console.error("Razorpay payment signature verification error:", error);
      return false;
    }
  }
}
