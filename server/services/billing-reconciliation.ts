import { db } from '../db';
import { 
  payments, 
  subscriptions, 
  licensePackages, 
  addonPurchases,
  subscriptionPlans
} from '../../shared/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

/**
 * Billing Reconciliation Service
 * 
 * Automated reconciliation between Razorpay payments and subscription entitlements
 * Detects discrepancies and alerts for manual investigation
 */

export interface ReconciliationDiscrepancy {
  type: 
    | 'payment_without_subscription'
    | 'subscription_without_payment'
    | 'user_id_mismatch'
    | 'status_mismatch'
    | 'amount_mismatch'
    | 'refund_not_reflected'
    | 'license_without_payment'
    | 'addon_without_payment';
  severity: 'critical' | 'warning' | 'info';
  paymentId?: string;
  subscriptionId?: string;
  licensePackageId?: string;
  addonPurchaseId?: string;
  userId?: string;
  details: string;
  suggestedAction?: string;
}

/**
 * Reconcile individual subscription payments
 * Ensures every successful payment has a corresponding active subscription
 */
export async function reconcileSubscriptionPayments(): Promise<ReconciliationDiscrepancy[]> {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  
  try {
    console.log(' Reconciling individual subscription payments...');
    
    // Get all successful payments with subscriptionId
    const successfulPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'succeeded'),
          isNotNull(payments.subscriptionId)
        )
      );
    
    console.log(`  Found ${successfulPayments.length} successful subscription payments`);
    
    for (const payment of successfulPayments) {
      // Check if subscription exists
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, payment.subscriptionId!));
      
      if (!subscription) {
        discrepancies.push({
          type: 'payment_without_subscription',
          severity: 'critical',
          paymentId: payment.id,
          subscriptionId: payment.subscriptionId!,
          userId: payment.userId,
          details: `Payment ${payment.id} (${payment.amount} ${payment.currency}) has no corresponding subscription ${payment.subscriptionId}`,
          suggestedAction: 'Investigate payment and potentially create missing subscription or refund payment'
        });
        continue;
      }
      
      // Check userId match
      if (subscription.userId !== payment.userId) {
        discrepancies.push({
          type: 'user_id_mismatch',
          severity: 'critical',
          paymentId: payment.id,
          subscriptionId: subscription.id,
          userId: payment.userId,
          details: `Payment ${payment.id} userId (${payment.userId}) does not match subscription userId (${subscription.userId})`,
          suggestedAction: 'Data corruption detected - investigate immediately'
        });
      }
      
      // Check status consistency
      if (subscription.status === 'canceled' || subscription.status === 'expired') {
        // Check if payment was recent (within last 7 days)
        const paymentDate = payment.createdAt ? new Date(payment.createdAt) : new Date();
        const daysSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSincePayment < 7) {
          discrepancies.push({
            type: 'status_mismatch',
            severity: 'warning',
            paymentId: payment.id,
            subscriptionId: subscription.id,
            userId: payment.userId,
            details: `Recent payment ${payment.id} (${daysSincePayment.toFixed(1)} days ago) but subscription is ${subscription.status}`,
            suggestedAction: 'Verify if subscription should be reactivated or payment should be refunded'
          });
        }
      }
      
      // Check refund reflection
      if (payment.refundedAt && subscription.status === 'active') {
        discrepancies.push({
          type: 'refund_not_reflected',
          severity: 'critical',
          paymentId: payment.id,
          subscriptionId: subscription.id,
          userId: payment.userId,
          details: `Payment ${payment.id} was refunded at ${payment.refundedAt} but subscription is still active`,
          suggestedAction: 'Cancel or expire subscription immediately'
        });
      }
    }
    
    // Check for subscriptions without payments (active subscriptions should have at least one payment)
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    for (const subscription of activeSubscriptions) {
      // Skip if this is a free trial or license-based access
      if (subscription.planType === 'free_trial') {
        continue;
      }
      
      const [payment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.subscriptionId, subscription.id),
            eq(payments.status, 'succeeded')
          )
        );
      
      if (!payment) {
        discrepancies.push({
          type: 'subscription_without_payment',
          severity: 'warning',
          subscriptionId: subscription.id,
          userId: subscription.userId,
          details: `Active subscription ${subscription.id} (type: ${subscription.planType}) has no successful payment record`,
          suggestedAction: 'Verify if this is license-based access or requires payment verification'
        });
      }
    }
    
    console.log(`  Found ${discrepancies.length} discrepancies in subscription payments`);
    return discrepancies;
    
  } catch (error) {
    console.error('❌ Error reconciling subscription payments:', error);
    return discrepancies;
  }
}

/**
 * Reconcile enterprise license package payments
 */
export async function reconcileLicensePayments(): Promise<ReconciliationDiscrepancy[]> {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  
  try {
    console.log(' Reconciling enterprise license payments...');
    
    // Get all active license packages
    const activePackages = await db
      .select()
      .from(licensePackages)
      .where(eq(licensePackages.status, 'active'));
    
    console.log(`  Found ${activePackages.length} active license packages`);
    
    for (const licensePackage of activePackages) {
      // Check if there's a payment for this license package
      const [payment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.razorpayOrderId, licensePackage.razorpayOrderId || ''),
            eq(payments.status, 'succeeded')
          )
        );
      
      if (!payment) {
        discrepancies.push({
          type: 'license_without_payment',
          severity: 'warning',
          licensePackageId: licensePackage.id,
          details: `License package ${licensePackage.id} (${licensePackage.totalSeats} seats, ${licensePackage.totalAmount} ${licensePackage.currency}) has no payment record`,
          suggestedAction: 'Verify license provisioning and payment records if this package is not test data.'
        });
      }
      
      // Check amount consistency
      if (payment) {
        const paymentAmount = parseFloat(payment.amount);
        const packageAmount = parseFloat(licensePackage.totalAmount);
        
        if (Math.abs(paymentAmount - packageAmount) > 0.01) {
          discrepancies.push({
            type: 'amount_mismatch',
            severity: 'warning',
            paymentId: payment.id,
            licensePackageId: licensePackage.id,
            details: `License package ${licensePackage.id} amount (${packageAmount}) does not match payment amount (${paymentAmount})`,
            suggestedAction: 'Verify correct package provisioned for payment amount'
          });
        }
      }
    }
    
    console.log(`  Found ${discrepancies.length} discrepancies in license payments`);
    return discrepancies;
    
  } catch (error) {
    console.error('❌ Error reconciling license payments:', error);
    return discrepancies;
  }
}

/**
 * Reconcile add-on purchases
 * 
 * LIMITATION: Current implementation uses heuristic matching (amount + timestamp)
 * because the schema doesn't provide a direct link between gatewayTransactionId
 * and payment records. For production-grade reconciliation, the schema should be
 * updated to store razorpayOrderId or razorpayPaymentId in addonPurchases table.
 * 
 * This provides "best-effort" detection but may have false positives/negatives.
 */
export async function reconcileAddonPayments(): Promise<ReconciliationDiscrepancy[]> {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  
  try {
    console.log(' Reconciling add-on purchases...');
    
    // Get all active add-on purchases
    const activeAddons = await db
      .select()
      .from(addonPurchases)
      .where(eq(addonPurchases.status, 'active'));
    
    console.log(`  Found ${activeAddons.length} active add-on purchases`);
    
    for (const addon of activeAddons) {
      const purchaseAmount = parseFloat(addon.purchaseAmount || '0');
      const isZeroValue = !Number.isFinite(purchaseAmount) || purchaseAmount <= 0.01;
      const metadata = (addon.metadata as any) || {};
      const gatewayProvider = metadata.gatewayProvider || metadata.paymentGateway;
      const isFreePromoAddon =
        metadata.freePromo === true ||
        gatewayProvider === 'free_promo' ||
        metadata.paymentMethod === 'promo_code_100%';

      // For genuine free / 100% promo add-ons, missing payment references are expected.
      if (!addon.gatewayTransactionId) {
        if (isZeroValue || isFreePromoAddon) {
          discrepancies.push({
            type: 'addon_free_without_payment',
            severity: 'info',
            addonPurchaseId: addon.id,
            userId: addon.userId,
            details: `Free/promo add-on purchase ${addon.id} (${addon.addonType}, ${addon.purchaseAmount} ${addon.currency}) has no payment reference, which is expected for 100% discounts or free grants.`,
            suggestedAction: 'No action required unless this add-on was not intended to be free.'
          });
          continue;
        }

        // Non-free add-ons without payment reference are potential revenue leaks,
        // but treat them as warnings so development/test data doesn't spam critical alerts.
        discrepancies.push({
          type: 'addon_without_payment',
          severity: 'warning',
          addonPurchaseId: addon.id,
          userId: addon.userId,
          details: `Add-on purchase ${addon.id} (${addon.addonType}, ${addon.purchaseAmount} ${addon.currency}) has NO payment reference (gatewayTransactionId)`,
          suggestedAction: 'Verify whether this add-on was intended to be free or manually granted; investigate payment records if not.'
        });
        continue;
      }
      
      // Look up payment using the specific gateway transaction reference
      // First, get all succeeded payments for this user
      const userPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.userId, addon.userId),
            eq(payments.status, 'succeeded')
          )
        );
      
      // Find payment matching the add-on's transaction ID by checking metadata or order ID
      // Note: addon.gatewayTransactionId links to gatewayTransactions table, but payments link via razorpayOrderId
      // We need to check if any payment matches this addon's amount and creation time window
      const addonAmount = parseFloat(addon.purchaseAmount);
      const addonDate = addon.startDate ? new Date(addon.startDate) : new Date();
      
      // Find payment within 1 hour of addon creation with matching amount
      const matchingPayment = userPayments.find(p => {
        const paymentAmount = parseFloat(p.amount);
        const paymentDate = p.createdAt ? new Date(p.createdAt) : new Date();
        const timeDiff = Math.abs(paymentDate.getTime() - addonDate.getTime()) / (1000 * 60); // minutes
        
        return Math.abs(paymentAmount - addonAmount) < 0.01 && timeDiff < 60;
      });
      
      if (!matchingPayment) {
        discrepancies.push({
          type: 'addon_without_payment',
          severity: 'warning',
          addonPurchaseId: addon.id,
          userId: addon.userId,
          details: `Add-on purchase ${addon.id} (${addon.addonType}, ${addon.purchaseAmount} ${addon.currency}) has gatewayTransactionId ${addon.gatewayTransactionId} but no matching payment found`,
          suggestedAction: 'Verify whether this add-on should be linked to a specific payment; investigate transaction records if this is not intentional.'
        });
      } else {
        // Verify amount matches exactly
        const paymentAmount = parseFloat(matchingPayment.amount);
        if (Math.abs(paymentAmount - addonAmount) > 0.01) {
          discrepancies.push({
            type: 'amount_mismatch',
            severity: 'warning',
            paymentId: matchingPayment.id,
            addonPurchaseId: addon.id,
            userId: addon.userId,
            details: `Add-on ${addon.id} amount (${addonAmount}) does not match payment amount (${paymentAmount})`,
            suggestedAction: 'Verify correct add-on provisioned for payment amount'
          });
        }
      }
    }
    
    console.log(`  Found ${discrepancies.length} discrepancies in add-on payments`);
    return discrepancies;
    
  } catch (error) {
    console.error('❌ Error reconciling add-on payments:', error);
    return discrepancies;
  }
}

/**
 * Run comprehensive billing reconciliation
 * Returns all detected discrepancies
 */
export async function runBillingReconciliation(): Promise<ReconciliationDiscrepancy[]> {
  const isProduction = process.env.NODE_ENV === 'production';
  const explicitlyEnabled = process.env.BILLING_RECONCILIATION_ENABLED === 'true';

  // In non-production environments, skip heavy reconciliation by default to
  // avoid noisy logs from historical/test data. Can be re-enabled via env flag.
  if (!isProduction && !explicitlyEnabled) {
    console.log(
      'Skipping billing reconciliation in non-production environment. Set BILLING_RECONCILIATION_ENABLED=true to run it.'
    );
    return [];
  }

  console.log(' Starting comprehensive billing reconciliation...');
  const startTime = Date.now();
  
  const subscriptionDiscrepancies = await reconcileSubscriptionPayments();
  const licenseDiscrepancies = await reconcileLicensePayments();
  const addonDiscrepancies = await reconcileAddonPayments();
  
  const allDiscrepancies = [
    ...subscriptionDiscrepancies,
    ...licenseDiscrepancies,
    ...addonDiscrepancies
  ];
  
  // Group by severity
  const critical = allDiscrepancies.filter(d => d.severity === 'critical');
  const warnings = allDiscrepancies.filter(d => d.severity === 'warning');
  const info = allDiscrepancies.filter(d => d.severity === 'info');
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  if (allDiscrepancies.length === 0) {
    console.log(`Billing reconciliation completed in ${duration}s - No discrepancies found`);
  } else {
    console.log(`⚠️ Billing reconciliation completed in ${duration}s`);
    console.log(`  ${critical.length} critical issues`);
    console.log(`  ${warnings.length} warnings`);
    console.log(`  ${info.length} informational`);
    
    // Log critical issues
    if (critical.length > 0) {
      console.log('\n🚨 CRITICAL BILLING ISSUES:');
      critical.forEach((d, i) => {
        console.log(`  ${i + 1}. [${d.type}] ${d.details}`);
        if (d.suggestedAction) {
          console.log(`     Action: ${d.suggestedAction}`);
        }
      });
    }
    
    // Log warnings
    if (warnings.length > 0 && warnings.length <= 5) {
      console.log('\n⚠️ BILLING WARNINGS:');
      warnings.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. [${d.type}] ${d.details}`);
      });
    }
  }
  
  return allDiscrepancies;
}
