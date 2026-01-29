export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  providerOrderId: string;
  paymentSessionId?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionResult {
  subscriptionId: string;
  planId: string;
  customerId: string;
  status: string;
  providerSubscriptionId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  providerPaymentId: string;
  method?: string;
  capturedAt?: Date;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  providerRefundId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStatus {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  method?: string;
  errorCode?: string;
  errorDescription?: string;
  metadata?: Record<string, any>;
}

export interface CustomerResult {
  customerId: string;
  providerCustomerId: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderOptions {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
  metadata?: Record<string, any>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreateSubscriptionOptions {
  planId: string;
  customerId: string;
  totalCount?: number;
  quantity?: number;
  startAt?: Date;
  expireBy?: Date;
  notes?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface CapturePaymentOptions {
  paymentId: string;
  amount?: number;
  currency?: string;
}

export interface RefundPaymentOptions {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
  reason?: string;
}

export interface CreateCustomerOptions {
  email: string;
  name: string;
  phone?: string;
  notes?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface IPaymentGateway {
  getProviderName(): string;

  createOrder(options: CreateOrderOptions): Promise<OrderResult>;

  createSubscription(options: CreateSubscriptionOptions): Promise<SubscriptionResult>;

  capturePayment(options: CapturePaymentOptions): Promise<PaymentResult>;

  refundPayment(options: RefundPaymentOptions): Promise<RefundResult>;

  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean;

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;

  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;

  createCustomer(options: CreateCustomerOptions): Promise<CustomerResult>;

  validateWebhookPayload(payload: any): boolean;

  parseWebhookEvent(payload: any): {
    eventType: string;
    entity: any;
    metadata?: Record<string, any>;
  };
}
