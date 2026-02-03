/**
 * Refund Service
 * 
 * Handles refunds for both development (test) and production environments
 * - DEV environment: Uses test/sandbox payment gateway credentials
 * - PROD environment: Uses live/production payment gateway credentials
 * 
 * Supports both Razorpay and Cashfree payment gateways
 */

import { PaymentGatewayFactory, type PaymentGatewayProvider } from "./payments";
import { billingStorage } from "../storage-billing";
import { authStorage } from "../storage-auth";
import { eventLogger } from "./event-logger";
import { paymentConfig } from "../config/payment-config";

export interface RefundOptions {
  paymentId?: string; // Optional for addon refunds with purchase history
  amount?: number; // Optional: if not provided, full refund
  reason: string;
  refundedBy: string; // Admin user ID
  notes?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  gatewayRefundId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  message?: string;
  error?: string;
  isTestMode?: boolean;
  metadata?: any; // For additional data like available payments
}

class RefundService {
  /**
   * Process a refund for a payment
   * Automatically detects environment and uses appropriate gateway credentials
   */
  async processRefund(options: RefundOptions & { paymentId: string }): Promise<RefundResult> {
    const { paymentId, amount, reason, refundedBy, notes } = options;

    try {
      console.log(`[Refund Service] Processing refund for payment ${paymentId}`);
      console.log(`[Refund Service] Environment: ${paymentConfig.environment} (${paymentConfig.isProduction ? 'PRODUCTION' : 'TEST'})`);
      console.log(`[Refund Service] Gateway: ${paymentConfig.gateway}`);

      // Get payment details
      const payment = await authStorage.getPaymentById(paymentId);
      if (!payment) {
        return {
          success: false,
          error: "Payment not found",
        };
      }

      // Check if payment is already refunded
      if (payment.status === 'refunded' || payment.status === 'partially_refunded') {
        return {
          success: false,
          error: `Payment is already ${payment.status}`,
        };
      }

      // Check if payment was successful
      if (payment.status !== 'succeeded') {
        return {
          success: false,
          error: `Cannot refund payment with status: ${payment.status}`,
        };
      }

      // Determine refund amount
      const paymentAmount = parseFloat(payment.amount);
      const refundAmount = amount || paymentAmount;

      // Validate refund amount
      if (refundAmount > paymentAmount) {
        return {
          success: false,
          error: `Refund amount (${refundAmount}) cannot exceed payment amount (${paymentAmount})`,
        };
      }

      if (refundAmount <= 0) {
        return {
          success: false,
          error: "Refund amount must be greater than 0",
        };
      }

      // Get gateway provider from payment metadata or use default
      const gatewayProvider = (payment.metadata as any)?.gatewayProvider || paymentConfig.gateway;
      
      // Get payment gateway instance
      const gateway = PaymentGatewayFactory.getGateway(gatewayProvider as PaymentGatewayProvider);

      // Get gateway payment ID (Razorpay payment ID or Cashfree payment ID)
      const gatewayPaymentId = payment.razorpayPaymentId || (payment.metadata as any)?.cashfreePaymentId;
      
      if (!gatewayPaymentId) {
        return {
          success: false,
          error: "Gateway payment ID not found in payment record",
        };
      }

      console.log(`[Refund Service] Initiating ${gatewayProvider} refund for ${gatewayPaymentId}`);
      console.log(`[Refund Service] Amount: ${refundAmount} ${payment.currency}`);

      // Process refund through payment gateway
      const refundResult = await gateway.refundPayment({
        paymentId: gatewayPaymentId,
        amount: refundAmount,
        reason: reason,
        notes: notes || {},
      });

      console.log(`[Refund Service] Gateway refund result:`, refundResult);

      // Determine if this is a full or partial refund
      const isFullRefund = refundAmount === paymentAmount;
      const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

      // Update payment record with refund information
      await authStorage.updatePaymentRefund(paymentId, {
        refundedAt: new Date(),
        refundAmount: refundAmount.toString(),
        refundReason: reason,
        razorpayRefundId: refundResult.providerRefundId,
        refundedBy: refundedBy,
        status: newStatus,
      });

      // Create refund record
      await authStorage.issueRefund(
        paymentId,
        payment.userId,
        refundAmount.toString(),
        payment.currency,
        reason,
        refundedBy
      );

      // Update refund status with gateway refund ID
      // Note: We need to get the refund ID we just created
      const userRefunds = await authStorage.getRefundsByUserId(payment.userId);
      const latestRefund = userRefunds[0]; // Most recent refund
      if (latestRefund) {
        await authStorage.updateRefundStatus(
          latestRefund.id,
          refundResult.status,
          refundResult.providerRefundId
        );
      }

      // Log refund event
      await eventLogger.log({
        actorId: refundedBy,
        action: 'payment.refunded',
        targetType: 'payment',
        targetId: paymentId,
        metadata: {
          refundAmount: refundAmount.toString(),
          currency: payment.currency,
          reason: reason,
          gatewayProvider: gatewayProvider,
          gatewayRefundId: refundResult.providerRefundId,
          isFullRefund,
          environment: paymentConfig.environment,
          isTestMode: !paymentConfig.isProduction,
        },
      });

      console.log(`[Refund Service] Refund processed successfully`);
      console.log(`[Refund Service] Refund ID: ${refundResult.refundId}`);
      console.log(`[Refund Service] Gateway Refund ID: ${refundResult.providerRefundId}`);
      console.log(`[Refund Service] Status: ${refundResult.status}`);

      return {
        success: true,
        refundId: refundResult.refundId,
        gatewayRefundId: refundResult.providerRefundId,
        amount: refundAmount,
        currency: payment.currency,
        status: refundResult.status,
        message: `Refund of ${refundAmount} ${payment.currency} processed successfully`,
        isTestMode: !paymentConfig.isProduction,
      };

    } catch (error: any) {
      console.error("[Refund Service] Error processing refund:", error);
      
      // Log failed refund attempt
      await eventLogger.log({
        actorId: refundedBy,
        action: 'payment.refund.failed',
        targetType: 'payment',
        targetId: paymentId,
        metadata: {
          error: error.message,
          reason: reason,
          environment: paymentConfig.environment,
        },
      });

      return {
        success: false,
        error: error.message || "Failed to process refund",
        isTestMode: !paymentConfig.isProduction,
      };
    }
  }

  /**
   * Process refund for an addon purchase
   */
  async processAddonRefund(options: RefundOptions & { addonPurchaseId: string; paymentId?: string }): Promise<RefundResult> {
    const { addonPurchaseId, amount, reason, refundedBy, notes, paymentId } = options;

    try {
      console.log(`[Refund Service] Processing addon refund for purchase ${addonPurchaseId}`);
      if (paymentId) {
        console.log(`[Refund Service] Specific payment ID requested: ${paymentId}`);
      }

      // Get addon purchase details
      const addonPurchase = await billingStorage.getAddonPurchase(addonPurchaseId);
      if (!addonPurchase) {
        return {
          success: false,
          error: "Addon purchase not found",
        };
      }

      const metadata = addonPurchase.metadata as any;
      
      // Check if this purchase has a history (merged session minutes)
      const purchaseHistory = metadata?.purchaseHistory;
      const hasPurchaseHistory = purchaseHistory && Array.isArray(purchaseHistory) && purchaseHistory.length > 0;
      
      // If purchase has history and no specific paymentId provided, return error
      if (hasPurchaseHistory && !paymentId) {
        return {
          success: false,
          error: `This purchase contains ${purchaseHistory.length} merged transactions. Please specify which payment to refund using the paymentId parameter.`,
          metadata: {
            availablePayments: purchaseHistory.map((h: any) => ({
              paymentId: h.paymentId,
              amount: h.amount,
              currency: h.currency,
              packageName: h.packageName,
              date: h.purchasedAt,
            })),
          },
        };
      }
      
      // Find the specific purchase to refund
      let targetPaymentId: string;
      let targetAmount: number;
      let targetCurrency: string;
      let targetPackageName: string;
      
      if (hasPurchaseHistory && paymentId) {
        // Find the specific item in purchase history
        const historyItem = purchaseHistory.find((h: any) => h.paymentId === paymentId);
        if (!historyItem) {
          return {
            success: false,
            error: `Payment ID ${paymentId} not found in purchase history`,
          };
        }
        
        // Check if this specific item was already refunded
        const refundedItems = metadata?.refundedItems || [];
        if (refundedItems.includes(paymentId)) {
          return {
            success: false,
            error: `Payment ${paymentId} has already been refunded`,
          };
        }
        
        targetPaymentId = historyItem.paymentId;
        targetAmount = parseFloat(historyItem.amount);
        targetCurrency = historyItem.currency;
        targetPackageName = historyItem.packageName;
        
        console.log(`[Refund Service] Refunding specific item: ${targetPackageName} - ${targetAmount} ${targetCurrency}`);
      } else {
        // Simple purchase (no history) - refund the whole thing
        if (addonPurchase.status === 'refunded') {
          return {
            success: false,
            error: "Addon purchase is already refunded",
          };
        }
        
        targetPaymentId = metadata?.paymentId || 
                         metadata?.cashfreePaymentId || 
                         metadata?.razorpayPaymentId || 
                         addonPurchase.gatewayTransactionId;
        targetAmount = parseFloat(addonPurchase.purchaseAmount);
        targetCurrency = addonPurchase.currency;
        targetPackageName = metadata?.packageName || addonPurchase.packageSku;
      }

      // Validate refund amount
      const refundAmount = amount || targetAmount;
      if (refundAmount > targetAmount) {
        return {
          success: false,
          error: `Refund amount (${refundAmount}) cannot exceed purchase amount (${targetAmount})`,
        };
      }

      if (!targetPaymentId) {
        console.error(`[Refund Service] No payment ID found. metadata:`, metadata);
        return {
          success: false,
          error: "Gateway payment ID not found in addon purchase record",
        };
      }

      // Get gateway provider
      const gatewayProvider = metadata?.gatewayProvider || paymentConfig.gateway;
      const gateway = PaymentGatewayFactory.getGateway(gatewayProvider as PaymentGatewayProvider);

      console.log(`[Refund Service] Initiating ${gatewayProvider} refund`);
      console.log(`[Refund Service] Gateway Payment ID: ${targetPaymentId}`);
      console.log(`[Refund Service] Amount: ${refundAmount} ${targetCurrency}`);

      // Process refund through payment gateway
      const refundResult = await gateway.refundPayment({
        paymentId: targetPaymentId,
        amount: refundAmount,
        reason: reason,
        notes: notes || {},
      });

      console.log(`[Refund Service] Gateway refund result:`, refundResult);

      // Update addon purchase with refund information
      if (hasPurchaseHistory && paymentId) {
        // Partial refund - mark this specific item as refunded
        const refundedItems = metadata?.refundedItems || [];
        refundedItems.push(paymentId);
        
        // Check if all items are now refunded
        const allRefunded = purchaseHistory.every((h: any) => refundedItems.includes(h.paymentId));
        
        await billingStorage.updateAddonPurchaseRefund(addonPurchaseId, {
          refundedAt: allRefunded ? new Date() : undefined,
          refundAmount: refundAmount.toString(),
          refundReason: reason,
          gatewayRefundId: refundResult.providerRefundId,
          refundedBy: refundedBy,
          status: allRefunded ? 'refunded' : 'partially_refunded',
          metadata: {
            ...metadata,
            refundedItems,
            partialRefunds: [
              ...(metadata?.partialRefunds || []),
              {
                paymentId: targetPaymentId,
                amount: refundAmount,
                currency: targetCurrency,
                packageName: targetPackageName,
                gatewayRefundId: refundResult.providerRefundId,
                refundedAt: new Date().toISOString(),
                refundedBy,
                reason,
              },
            ],
          },
        });
      } else {
        // Full refund - mark entire purchase as refunded
        await billingStorage.updateAddonPurchaseRefund(addonPurchaseId, {
          refundedAt: new Date(),
          refundAmount: refundAmount.toString(),
          refundReason: reason,
          gatewayRefundId: refundResult.providerRefundId,
          refundedBy: refundedBy,
          status: 'refunded',
        });
      }

      // Log refund event
      await eventLogger.log({
        actorId: refundedBy,
        action: 'addon_purchase.refunded',
        targetType: 'addon_purchase',
        targetId: addonPurchaseId,
        metadata: {
          refundAmount: refundAmount.toString(),
          currency: targetCurrency,
          reason: reason,
          addonType: addonPurchase.addonType,
          gatewayProvider: gatewayProvider,
          gatewayRefundId: refundResult.providerRefundId,
          paymentId: targetPaymentId,
          packageName: targetPackageName,
          isPartialRefund: hasPurchaseHistory && paymentId,
          environment: paymentConfig.environment,
          isTestMode: !paymentConfig.isProduction,
        },
      });

      console.log(`[Refund Service] Addon refund processed successfully`);

      return {
        success: true,
        refundId: refundResult.refundId,
        gatewayRefundId: refundResult.providerRefundId,
        amount: refundAmount,
        currency: targetCurrency,
        status: refundResult.status,
        message: `Refund of ${refundAmount} ${targetCurrency} for ${targetPackageName} processed successfully`,
        isTestMode: !paymentConfig.isProduction,
      };

    } catch (error: any) {
      console.error("[Refund Service] Error processing addon refund:", error);

      // Log failed refund attempt
      await eventLogger.log({
        actorId: refundedBy,
        action: 'addon_purchase.refund.failed',
        targetType: 'addon_purchase',
        targetId: addonPurchaseId,
        metadata: {
          error: error.message,
          reason: reason,
          paymentId: paymentId,
          environment: paymentConfig.environment,
        },
      });

      return {
        success: false,
        error: error.message || "Failed to process addon refund",
        isTestMode: !paymentConfig.isProduction,
      };
    }
  }

  /**
   * Get refund status from payment gateway
   */
  async getRefundStatus(gatewayRefundId: string, gatewayProvider?: PaymentGatewayProvider): Promise<any> {
    try {
      const provider = gatewayProvider || paymentConfig.gateway as PaymentGatewayProvider;
      const gateway = PaymentGatewayFactory.getGateway(provider);

      // Note: This would require implementing a getRefundStatus method in the gateway adapters
      // For now, we'll return a placeholder
      console.log(`[Refund Service] Getting refund status for ${gatewayRefundId} from ${provider}`);

      return {
        refundId: gatewayRefundId,
        status: 'processed',
        message: 'Refund status check not yet implemented',
      };
    } catch (error: any) {
      console.error("[Refund Service] Error getting refund status:", error);
      throw error;
    }
  }

  /**
   * Get environment info for display
   */
  getEnvironmentInfo() {
    return {
      environment: paymentConfig.environment,
      isProduction: paymentConfig.isProduction,
      gateway: paymentConfig.gateway,
      razorpayMode: paymentConfig.razorpay.mode,
      cashfreeEnvironment: paymentConfig.cashfree.environment,
    };
  }
}

export const refundService = new RefundService();
