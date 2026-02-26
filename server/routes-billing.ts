import { Router, type Request, type Response } from "express";
import { authenticateToken } from "./middleware/auth";
import { captureRawBody } from "./middleware/raw-body";
import { billingStorage } from "./storage-billing";
import { authStorage } from "./storage-auth";
import { PaymentGatewayFactory, type PaymentGatewayProvider } from "./services/payments";
import { DEFAULT_PAYMENT_GATEWAY } from "./config/payment.config";
import { currencyConverter } from "./services/currency-converter";
import {
  getPackageBySku,
  getPackageOrAddonBySku,
  getAddonTypeFromSku,
  calculateEndDate,
  getAllPackages,
  PLATFORM_ACCESS_PACKAGES,
} from "./config/pricing";
import {
  purchasePlatformAccessSchema,
  type AddonPurchase,
  addonPurchases,
  conversations,
  sessionUsage,
  systemConfig,
} from "../shared/schema";
import { z } from "zod";
import { eventLogger } from './services/event-logger';
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

/** Load company and terms for invoice from system_config (optional). No hardcoded branding. */
async function getInvoiceConfig(): Promise<{
  company: { name: string; address: string; email: string; website: string; gstNumber: string | null };
  terms: string[];
}> {
  const defaults = {
    company: {
      name: "",
      address: "",
      email: "",
      website: "",
      gstNumber: null as string | null,
    },
    terms: [] as string[],
  };
  try {
    const rows = await db.select().from(systemConfig).where(eq(systemConfig.section, "system"));
    const map: Record<string, string> = {};
    rows.forEach((r) => {
      map[r.key] = r.value ?? "";
    });
    const name = (map.siteName || "").trim();
    const address = (map.companyAddress || "").trim();
    const email = (map.supportEmail || "").trim();
    const website = (map.siteUrl || "").trim();
    const gstNumber = (map.gstNumber || "").trim() || null;
    const termsRaw = (map.invoiceTerms || "").trim();
    const terms = termsRaw ? termsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
    return {
      company: { name, address, email, website, gstNumber },
      terms: terms.length > 0 ? terms : defaults.terms,
    };
  } catch {
    return defaults;
  }
}

// Helper function to get Razorpay credentials based on environment
// RAZORPAY_MODE takes absolute precedence - if set to LIVE, use LIVE regardless of NODE_ENV
function getRazorpayKeyId(): string | undefined {
  // Check RAZORPAY_MODE first - if explicitly set, use it regardless of NODE_ENV
  if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else if (process.env.RAZORPAY_MODE === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
  
  // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
  
  if (razorpayMode === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
}

function getRazorpayKeySecret(): string | undefined {
  // Check RAZORPAY_MODE first - if explicitly set, use it regardless of NODE_ENV
  if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
    return process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  } else if (process.env.RAZORPAY_MODE === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  }
  
  // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
  
  if (razorpayMode === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  } else {
    return process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  }
}

/**
 * Activate cart checkout items after payment verification
 * This function is called from both the cart verify endpoint and the webhook handler
 */
async function activateCartCheckout(
  pendingOrder: any,
  verifiedPaymentId: string | undefined,
  gatewayTransactionId: string | undefined,
  req?: Request
): Promise<{ success: boolean; activatedAddons: AddonPurchase[]; message?: string }> {
  try {
    const userId = pendingOrder.userId;
    const orderId = pendingOrder.id; 

    // Extract cart items from metadata
    const metadata = pendingOrder.metadata as any;
    const cartItems = metadata?.items as Array<{
      packageSku: string;
      packageName: string;
      addonType: string;
      basePrice: string;
      currency: string;
      quantity: number;
      metadata: any;
      purchaseMode?: string;
      teamManagerName?: string;
      teamManagerEmail?: string;
      companyName?: string;
    }>;

    if (!cartItems || cartItems.length === 0) {
      return { success: false, activatedAddons: [], message: "No items found in order" };
    }

    // Only activate personal (non-team) items here; team items are handled by team flow in verify/free-order
    const personalItems = cartItems.filter((i: any) => i.purchaseMode !== 'team');
    if (personalItems.length < cartItems.length) {
      console.log(`[Cart Activation] Skipping ${cartItems.length - personalItems.length} team items; processing ${personalItems.length} personal items`);
    }

    // Extract per-item promo codes and increment usage counts
    const perItemPromoCodes = metadata?.perItemPromoCodes as Array<{
      cartItemId: string;
      promoCodeId: string | null;
      promoCodeCode: string | null;
      appliedDiscountAmount: string | null;
    }> || [];

    // Increment usage counts for all unique promo codes used
    const uniquePromoCodeIds = Array.from(new Set(
      perItemPromoCodes
        .filter(p => p.promoCodeId)
        .map(p => p.promoCodeId!)
    ));

    for (const promoCodeId of uniquePromoCodeIds) {
      await authStorage.incrementPromoCodeUses(promoCodeId);
    }

    const activatedAddons: AddonPurchase[] = [];

    // Activate each personal (non-team) item
    for (const item of personalItems) {
      const pkg = await getPackageOrAddonBySku(item.packageSku);
      if (!pkg) continue;

      // Map addonType from cart format to addonPurchases format
      // Cart uses: 'usage_bundle', 'service', 'platform_access'
      // addonPurchases needs: 'session_minutes', 'train_me', 'dai', 'platform_access'
      let mappedAddonType = item.addonType;
      if (item.addonType === 'usage_bundle') {
        // Session minutes are stored as 'usage_bundle' in cart but 'session_minutes' in addonPurchases
        mappedAddonType = 'session_minutes';
        mappedAddonType = 'session_minutes';
        console.log(`[Cart Activation] Mapping addonType: ${item.addonType} → ${mappedAddonType} for package ${item.packageSku} (${pkg.name})`);
      } else if (item.addonType === 'service') {
        // Determine if it's train_me, dai, or session_minutes based on package SKU or metadata
        const packageSkuLower = item.packageSku.toLowerCase();
        const packageNameLower = (pkg.name || '').toLowerCase();
        
        // Check for session minutes first (might be labeled as service)
        if (packageSkuLower.includes('session') || packageSkuLower.includes('minute') || 
            packageNameLower.includes('session') || packageNameLower.includes('minute')) {
          mappedAddonType = 'session_minutes';
        } else if (packageSkuLower.includes('train') || packageNameLower.includes('train')) {
          mappedAddonType = 'train_me';
        } else if (packageSkuLower.includes('dai') || packageNameLower.includes('dai')) {
          mappedAddonType = 'dai';
        } else {
          // If still unclear, default to train_me for service type
          // (SKU/name-based detection above should handle most cases)
          mappedAddonType = 'train_me';
        }
        console.log(`[Cart Activation] Mapping addonType: ${item.addonType} → ${mappedAddonType} for package ${item.packageSku} (${pkg.name})`);
      }
      
      // Calculate the actual paid amount for this item
      // Use the actual paid amount from pending order (which includes currency conversion and GST)
      const totalPaidAmount = parseFloat(pendingOrder.amount || '0');
      const actualCurrency = pendingOrder.currency || 'USD';
      const itemCount = cartItems.length;
      
      // Find the corresponding promo code info for this item
      const itemPromoInfo = perItemPromoCodes.find(p => {
        // Match by packageSku since cartItemId might not be available
        const cartItem = cartItems.find(ci => ci.packageSku === item.packageSku);
        return cartItem && p.cartItemId === cartItem.packageSku;
      });
      
      // Calculate item's discounted price (basePrice - discount)
      const itemBasePrice = parseFloat(item.basePrice) * item.quantity;
      const itemDiscount = itemPromoInfo?.appliedDiscountAmount ? parseFloat(itemPromoInfo.appliedDiscountAmount) : 0;
      const itemDiscountedPrice = itemBasePrice - itemDiscount;
      
      // Calculate proportionally based on DISCOUNTED price, not base price
      const cartSubtotal = parseFloat(metadata.subtotal || '0');
      const cartDiscount = parseFloat(metadata.discount || '0');
      const cartDiscountedSubtotal = cartSubtotal - cartDiscount;
      
      // For single item carts, use the full amount; for multi-item, calculate proportionally based on discounted prices
      const itemPaidAmount = itemCount === 1 ? totalPaidAmount : (totalPaidAmount * itemDiscountedPrice) / (cartDiscountedSubtotal || 1);
      
      console.log(`[Cart Activation] Item pricing - basePrice: ${itemBasePrice}, discount: ${itemDiscount}, discountedPrice: ${itemDiscountedPrice}, paidAmount: ${itemPaidAmount.toFixed(2)} ${actualCurrency}`);
      
      console.log(`[Cart Activation] Creating purchase: addonType=${mappedAddonType}, packageSku=${item.packageSku}, totalUnits=${pkg.totalUnits || 0}, paidAmount=${itemPaidAmount.toFixed(2)} ${actualCurrency}`);

      // For session_minutes: Check if user already has an active purchase and add to it
      // This handles the unique constraint that prevents multiple active purchases per user per addon type
      if (mappedAddonType === 'session_minutes') {
        const existingPurchase = await billingStorage.getActiveAddonPurchase(userId, 'session_minutes');
        // Use pkg.totalUnits, or fall back to cart-stored totalUnits (in case addon uses pricingTiers not metadata.minutes)
        let unitsPerItem = pkg.totalUnits ?? (item.metadata as any)?.totalUnits ?? 0;
        if (unitsPerItem === 0 && (item.packageName || pkg.name)) {
          const nameMatch = (item.packageName || pkg.name).match(/(\d+)\s*minutes?/i);
          if (nameMatch) unitsPerItem = parseInt(nameMatch[1], 10);
        }
        const newMinutes = Math.max(0, Number(unitsPerItem) || 0) * item.quantity;
        if (newMinutes === 0) {
          console.warn(`[Cart Activation] Session minutes item skipped: packageSku=${item.packageSku}, totalUnits/unitsPerItem=0. Fix addon metadata.minutes or pricingTiers.`);
          continue;
        }
        const startDate = new Date();
        const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : null;

        if (existingPurchase) {
          // Add minutes to existing purchase
          const currentTotalUnits = existingPurchase.totalUnits || 0;
          const currentUsedUnits = existingPurchase.usedUnits || 0;
          const newTotalUnits = currentTotalUnits + newMinutes;
          
          // Use the latest endDate (whichever is later)
          const existingEndDate = existingPurchase.endDate;
          const finalEndDate = existingEndDate && endDate 
            ? (existingEndDate > endDate ? existingEndDate : endDate)
            : (endDate || existingEndDate);

          // Update metadata to include this purchase
          const existingMetadata = (existingPurchase.metadata as any) || {};
          const purchaseHistory = Array.isArray(existingMetadata.purchaseHistory) 
            ? existingMetadata.purchaseHistory 
            : [];
        
          purchaseHistory.push({
            orderId: orderId,
            packageSku: item.packageSku,
            packageName: pkg.name,
            minutesAdded: newMinutes,
            amount: itemPaidAmount.toFixed(2), // Use actual paid amount
            currency: actualCurrency, // Use actual currency
            quantity: item.quantity,
            purchasedViaCart: true,
            paymentId: verifiedPaymentId,
            gatewayProvider: pendingOrder.gatewayProvider,
            purchasedAt: startDate.toISOString(),
          });

          // Update the purchase
          const updatedPurchase = await db
            .update(addonPurchases)
            .set({
              totalUnits: newTotalUnits,
              endDate: finalEndDate,
              updatedAt: new Date(),
              metadata: {
                ...existingMetadata,
                purchaseHistory,
                lastPurchaseOrderId: orderId,
                lastPurchaseDate: startDate.toISOString(),
              },
            })
            .where(eq(addonPurchases.id, existingPurchase.id))
            .returning()
            .then((result: AddonPurchase[]) => result[0]);

          activatedAddons.push(updatedPurchase);
          console.log(`[Cart Activation] Added ${newMinutes} minutes to existing session_minutes purchase. New total: ${newTotalUnits} minutes`);
        } else {
          // Create new purchase
          const addon = await billingStorage.createAddonPurchase({
            userId,
            organizationId: null,
            addonType: mappedAddonType,
            packageSku: item.packageSku,
            billingType: 'one_time',
            purchaseAmount: itemPaidAmount.toFixed(2), // Use actual paid amount
            currency: actualCurrency, // Use actual currency
            totalUnits: newMinutes,
            usedUnits: 0,
            status: 'active',
            startDate,
            endDate,
            gatewayTransactionId: gatewayTransactionId || undefined,
            metadata: {
              packageName: pkg.name,
              basePrice: item.basePrice, // Keep original base price for reference
              quantity: item.quantity,
              purchasedViaCart: true,
              cartOrderId: orderId,
              paymentId: verifiedPaymentId,
              gatewayProvider: pendingOrder.gatewayProvider,
              originalAddonType: item.addonType,
              actualPaidAmount: itemPaidAmount.toFixed(2), // Store actual paid amount
              actualCurrency: actualCurrency, // Store actual currency
              purchaseHistory: [{
                orderId: orderId,
                packageSku: item.packageSku,
                packageName: pkg.name,
                minutesAdded: newMinutes,
                amount: itemPaidAmount.toFixed(2), // Use actual paid amount
                currency: actualCurrency, // Use actual currency
                quantity: item.quantity,
                purchasedViaCart: true,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                purchasedAt: startDate.toISOString(),
              }],
            },
          });

          activatedAddons.push(addon);
          console.log(`[Cart Activation] Created new session_minutes purchase with ${newMinutes} minutes`);
        }
      } else {
        // For platform_access, train_me, dai: Create one purchase per quantity item
        for (let i = 0; i < item.quantity; i++) {
          const startDate = new Date();
          const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : null;

          try {
            const addon = await billingStorage.createAddonPurchase({
              userId,
              organizationId: null,
              addonType: mappedAddonType,
              packageSku: item.packageSku,
              billingType: 'one_time',
              purchaseAmount: itemPaidAmount.toFixed(2), // Use actual paid amount
              currency: actualCurrency, // Use actual currency
              totalUnits: pkg.totalUnits || 0,
              usedUnits: 0,
              status: 'active',
              startDate,
              endDate,
              gatewayTransactionId: gatewayTransactionId || undefined,
              metadata: {
                packageName: pkg.name,
                basePrice: item.basePrice, // Keep original base price for reference
                quantity: 1,
                purchasedViaCart: true,
                cartOrderId: orderId,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                itemNumber: i + 1,
                totalItems: item.quantity,
                originalAddonType: item.addonType, // Store original for reference
                actualPaidAmount: itemPaidAmount.toFixed(2), // Store actual paid amount
                actualCurrency: actualCurrency, // Store actual currency
              },
            });

            activatedAddons.push(addon);
          } catch (error: any) {
            // Handle duplicate addon error gracefully
            if (error?.code === '23505' && error?.constraint === 'unique_active_addon_per_user') {
              console.error(`[Cart Activation] User already has active ${mappedAddonType} addon. Skipping item: ${item.packageName}`);
              throw new Error(`You already have an active ${mappedAddonType === 'dai' ? 'Domain AI Intelligence' : mappedAddonType === 'train_me' ? 'Train Me' : mappedAddonType} subscription. Please cancel your existing subscription before purchasing a new one.`);
            }
            throw error; // Re-throw other errors
          }
        }
      }
    }

    // Check if any purchased personal item is a platform_access subscription
    const platformAccessItems = personalItems.filter(item => item.addonType === 'platform_access');
    
    console.log(`[Cart Activation] Found ${platformAccessItems.length} platform_access items out of ${personalItems.length} personal items`);
    
    if (platformAccessItems.length > 0) {
      const subscriptionItem = platformAccessItems[0];
      const pkg = await getPackageOrAddonBySku(subscriptionItem.packageSku);
      
      if (pkg) {
        const existingSubscription = await authStorage.getSubscriptionByUserId(userId);
        
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        
        // Calculate period end based on billingType
        if (pkg.billingType === '36_months') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 3);
        } else if (pkg.billingType === '12_months') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        } else if (pkg.billingType === '6_months') {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
        } else if (pkg.validityDays) {
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + pkg.validityDays);
        } else {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }
        
        let planType = 'yearly';
        if (pkg.billingType === '36_months') {
          planType = 'three_year';
        } else if (pkg.billingType === '12_months') {
          planType = 'yearly';
        } else {
          planType = 'monthly';
        }
        
        if (existingSubscription) {
          await authStorage.updateSubscription(existingSubscription.id, {
            planId: undefined,
            planType,
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
            sessionsUsed: '0',
            sessionsLimit: undefined,
            minutesUsed: '0',
            minutesLimit: undefined,
            sessionHistory: [],
          });
        } else {
          await authStorage.createSubscription({
            userId,
            planId: undefined,
            planType,
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
            sessionsUsed: '0',
            sessionsLimit: undefined,
            minutesUsed: '0',
            minutesLimit: undefined,
            sessionHistory: [],
          });
        }

        // Create audit log for subscription activation
        await eventLogger.log({
          actorId: userId,
          action: 'subscription.activated',
          targetType: 'subscription',
          targetId: existingSubscription?.id || 'new',
          metadata: { 
            packageSku: subscriptionItem.packageSku,
            billingType: pkg.billingType,
            source: 'cart_checkout',
            orderId,
          },
          ipAddress: req?.ip,
          userAgent: req?.get('user-agent'),
        });
      }
    }

    // Mark pending order as completed.
    // For free 100% discount orders we already created the pendingOrder with
    // status 'completed', so calling updatePendingOrderStatus again would
    // throw an "order is already completed" error. Only transition from
    // 'pending' → 'completed' when appropriate.
    if (pendingOrder.status === 'pending') {
      await billingStorage.updatePendingOrderStatus(orderId, userId, 'completed', new Date());
    } else {
      console.log(
        `[Cart Activation] Skipping pending order status update for order ${orderId} (status=${pendingOrder.status})`
      );
    }

    // Clear user's cart
    await billingStorage.clearCart(userId);

    // Refresh user entitlements
    await billingStorage.refreshUserEntitlements(userId);

    console.log(`[Cart Activation] Successfully activated ${activatedAddons.length} items for order ${orderId}`);

    return { success: true, activatedAddons };
  } catch (error: any) {
    console.error("[Cart Activation] Error activating cart checkout:", error);
    return { success: false, activatedAddons: [], message: error.message };
  }
}

/** Run team cart activation: create/find org, license package, org add-ons, send invitation. Used by verify and free-order. */
async function runTeamCartActivation(
  pendingOrder: any,
  userId: string,
  req: Request
): Promise<{ licenseManagerInvitationSent: boolean }> {
  const metadata = pendingOrder.metadata as any;
  const cartItems = (metadata?.items || []) as Array<{
    packageSku: string;
    packageName: string;
    addonType: string;
    basePrice: string;
    currency: string;
    quantity: number;
    metadata: any;
    purchaseMode?: string;
    teamManagerName?: string;
    teamManagerEmail?: string;
    companyName?: string;
  }>;
  const teamItems = cartItems.filter(item => item.purchaseMode === 'team');
  if (teamItems.length === 0) return { licenseManagerInvitationSent: false };

  let licenseManagerInvitationSent = false;
  try {
    const { sendLicenseManagerInvitationEmail } = await import('./services/email');
    const crypto = await import('crypto');
    const teamItem = teamItems[0];
    const teamManagerName = teamItem.teamManagerName as string;
    const teamManagerEmail = teamItem.teamManagerEmail as string;

    if (!teamManagerName || !teamManagerEmail) return { licenseManagerInvitationSent: false };

    const buyer = await authStorage.getUserById(userId);
    const buyerName = buyer ? `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.email : 'A Rev Winner customer';
    const purchaseDetails = {
      platformAccessCount: cartItems.filter(item => item.addonType === 'platform_access').reduce((sum, item) => sum + (item.quantity || 1), 0),
      sessionMinutesCount: cartItems.filter(item => (item.addonType === 'session_minutes' || item.addonType === 'usage_bundle')).reduce((sum, item) => sum + (item.quantity || 1), 0),
      daiCount: cartItems.filter(item => item.addonType === 'dai' || (item.addonType === 'service' && (item.packageSku || '').toLowerCase().includes('dai'))).reduce((sum, item) => sum + (item.quantity || 1), 0),
      trainMeCount: cartItems.filter(item => item.addonType === 'train_me' || (item.addonType === 'service' && (item.packageSku || '').toLowerCase().includes('train'))).reduce((sum, item) => sum + (item.quantity || 1), 0),
      totalAmount: pendingOrder.amount || '0',
      buyerName,
    };

    let licenseManager = await authStorage.getUserByEmail(teamManagerEmail);
    if (!licenseManager) {
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const nameParts = teamManagerName.trim().split(' ');
      const firstName = nameParts[0] || teamManagerName;
      const lastName = nameParts.slice(1).join(' ') || '';
      const username = teamManagerEmail.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
      licenseManager = await authStorage.createUser({
        email: teamManagerEmail,
        username,
        password: tempPassword,
        firstName,
        lastName,
        role: 'license_manager',
      });
      console.log(`Created License Manager user: ${licenseManager.id} (${teamManagerEmail})`);
    } else if (licenseManager.role !== 'license_manager') {
      await authStorage.updateUser(licenseManager.id, { role: 'license_manager' });
      console.log(`Updated user ${licenseManager.id} role to license_manager`);
    }

    const companyName = teamItem.companyName as string || `${teamManagerName}'s Organization`;
    let organization = await authStorage.getOrganizationByManagerId(licenseManager.id);
    if (!organization) {
      organization = await authStorage.createOrganization({
        companyName,
        billingEmail: teamManagerEmail,
        primaryManagerId: licenseManager.id,
        status: 'active',
      });
      console.log(`Created organization: ${organization.id} (${companyName})`);
      await authStorage.createOrganizationMembership({
        organizationId: organization.id,
        userId: licenseManager.id,
        role: 'admin',
        status: 'active',
      });
      console.log(`Added license manager to organization membership`);
    } else {
      if (organization.companyName !== companyName || organization.primaryManagerId !== licenseManager.id) {
        await authStorage.updateOrganization(organization.id, {
          companyName,
          primaryManagerId: licenseManager.id,
          billingEmail: teamManagerEmail,
        });
        console.log(`Updated organization: ${organization.id} (${companyName})`);
      }
      const existingMembership = await authStorage.getUserMembership(licenseManager.id);
      if (!existingMembership || existingMembership.organizationId !== organization.id) {
        try {
          await authStorage.createOrganizationMembership({
            organizationId: organization.id,
            userId: licenseManager.id,
            role: 'admin',
            status: 'active',
          });
          console.log(`Added license manager to existing organization membership`);
        } catch (membershipError: any) {
          if (membershipError.code !== '23505') throw membershipError;
          console.log(`License manager already has membership for organization`);
        }
      }
    }

    const teamPlatformAccessItems = teamItems.filter(item => item.addonType === 'platform_access');
    const totalSeats = teamPlatformAccessItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (totalSeats > 0) {
      const platformAccessItem = teamPlatformAccessItems[0];
      const pricePerSeat = platformAccessItem?.basePrice || '0';
      const currency = platformAccessItem?.currency || 'USD';
      const pkg = platformAccessItem ? await getPackageOrAddonBySku(platformAccessItem.packageSku) : null;
      const validityDays = pkg?.validityDays || 365;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
      const licensePackage = await authStorage.createLicensePackage({
        organizationId: organization.id,
        packageType: platformAccessItem?.packageSku || 'team-platform-access',
        totalSeats,
        pricePerSeat,
        totalAmount: (parseFloat(pricePerSeat) * totalSeats).toString(),
        currency,
        startDate,
        endDate,
        status: 'active',
      });
      console.log(`Created license package: ${licensePackage.id} with ${totalSeats} seats for organization ${organization.id}`);
      (purchaseDetails as any).licensePackageId = licensePackage.id;
      (purchaseDetails as any).organizationId = organization.id;
    }

    const teamAddonTypes = ['session_minutes', 'train_me', 'dai'];
    for (const item of cartItems.filter((i: any) => i.purchaseMode === 'team')) {
      let mappedType = item.addonType;
      if (item.addonType === 'usage_bundle') mappedType = 'session_minutes';
      if (item.addonType === 'service') {
        const sku = (item.packageSku || '').toLowerCase();
        mappedType = sku.includes('train') ? 'train_me' : sku.includes('dai') ? 'dai' : 'train_me';
      }
      if (!teamAddonTypes.includes(mappedType)) continue;
      const pkg = await getPackageOrAddonBySku(item.packageSku);
      if (!pkg) continue;
      const startDate = new Date();
      const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : null;
      const totalUnits = (pkg.totalUnits || 0) * (item.quantity || 1);
      const itemPaidAmount = parseFloat(pendingOrder.amount || '0') / Math.max(1, cartItems.length);
      try {
        await billingStorage.createAddonPurchase({
          userId: licenseManager.id,
          organizationId: organization.id,
          addonType: mappedType,
          packageSku: item.packageSku,
          billingType: 'one_time',
          purchaseAmount: itemPaidAmount.toFixed(2),
          currency: pendingOrder.currency || 'USD',
          totalUnits,
          usedUnits: 0,
          status: 'active',
          startDate,
          endDate,
          metadata: { teamPurchase: true, cartOrderId: pendingOrder.id, packageName: pkg.name },
        });
        console.log(`[Team Cart] Created org addon: ${mappedType} for org ${organization.id}, ${totalUnits} units`);
      } catch (addonErr: any) {
        console.error('[Team Cart] Failed to create org addon:', addonErr);
      }
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await authStorage.createPasswordResetToken(teamManagerEmail, resetToken, resetTokenExpiry);
    await sendLicenseManagerInvitationEmail(teamManagerEmail, teamManagerName, resetToken, purchaseDetails);
    licenseManagerInvitationSent = true;
    console.log(`License Manager invitation sent to ${teamManagerEmail}`);
    await eventLogger.log({
      actorId: userId,
      action: 'team_purchase.completed',
      targetType: 'license_manager',
      targetId: licenseManager.id,
      metadata: { licenseManagerEmail: teamManagerEmail, licenseManagerName: teamManagerName, purchaseDetails, orderId: pendingOrder.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (err) {
    console.error('runTeamCartActivation error:', err);
  }
  return { licenseManagerInvitationSent };
}

// Get the base URL for payment callbacks - uses APP_URL in production, falls back to request host
function getBaseUrl(req: Request): string {
  // Use APP_URL environment variable if set (for production/development with tunnels)
  if (process.env.APP_URL) {
    const appUrl = process.env.APP_URL.trim();
    // Ensure it ends without trailing slash
    return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  }
  
  // Get host from request
  const host = req.get('host') || 'localhost:5000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  // For Cashfree:
  // - PRODUCTION mode requires HTTPS URLs and domain whitelisting
  // - SANDBOX mode allows HTTP for localhost and doesn't require whitelisting
  // Check if we're using sandbox mode (for localhost development)
  const isSandbox = process.env.CASHFREE_ENVIRONMENT === 'SANDBOX' || 
    (!process.env.APP_URL && isLocalhost && process.env.NODE_ENV !== 'production');
  
  // Use HTTP for localhost in sandbox mode, HTTPS otherwise
  if (isSandbox && isLocalhost) {
    return `http://${host}`;
  }
  
  // Force HTTPS for production mode or non-localhost
  return `https://${host}`;
}

// Get Cashfree mode for frontend SDK
function getCashfreeMode(): 'sandbox' | 'production' {
  return process.env.CASHFREE_ENVIRONMENT === 'SANDBOX' ? 'sandbox' : 'production';
}

export function setupBillingRoutes(app: Router) {
  console.log('🔧 Setting up billing routes...');
  
  // ========================================
  // PRICING & PACKAGES
  // ========================================

  // Test endpoint to verify cart verification route is working
  app.get("/api/cart/test", (req, res) => {
    res.json({ message: "Cart verification route is working", timestamp: new Date().toISOString() });
  });

  // Get order details for verification routing (used by payment success page)
  app.get("/api/billing/order-details", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { orderId } = req.query;

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ message: "Order ID is required" });
      }

      // Get pending order
      const pendingOrder = await billingStorage.getPendingOrder(orderId);
      if (!pendingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Security check: Verify user owns this order
      if (pendingOrder.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Include team manager details for debugging
      const metadata = pendingOrder.metadata as any;
      const teamItems = metadata?.items?.filter((item: any) => item.purchaseMode === 'team') || [];
      const teamManagerInfo = teamItems.length > 0 ? {
        teamManagerEmail: teamItems[0].teamManagerEmail,
        teamManagerName: teamItems[0].teamManagerName,
        companyName: teamItems[0].companyName,
      } : null;

      res.json({
        orderId: pendingOrder.id,
        addonType: pendingOrder.addonType,
        packageSku: pendingOrder.packageSku,
        amount: pendingOrder.amount,
        currency: pendingOrder.currency,
        status: pendingOrder.status,
        gatewayProvider: pendingOrder.gatewayProvider,
        teamManagerInfo, // Include for debugging
      });
    } catch (error: any) {
      console.error("Get order details error:", error);
      res.status(500).json({ message: "Failed to get order details", error: error.message });
    }
  });

  // Get session minutes packages
  app.get("/api/session-minutes/packages", async (req: Request, res: Response) => {
    try {
      // Get published addons from database
      const publishedAddons = await billingStorage.getPublishedAddons();
      // Filter for session minutes addons (slug should be 'session-minutes' or check metadata)
      const sessionMinutesAddons = publishedAddons.filter(addon => 
        addon.slug === 'session-minutes' || 
        (addon.metadata as any)?.addonType === 'session_minutes' ||
        addon.type === 'usage_bundle'
      );
      
      // Transform to frontend format
      const packages: Array<{ id: string; minutes: number; price: number; name: string }> = [];
      
      for (const addon of sessionMinutesAddons) {
        // Check if addon has pricingTiers (for usage_bundle type)
        if (addon.pricingTiers && Array.isArray(addon.pricingTiers)) {
          const tiers = addon.pricingTiers as Array<{ minutes: number; price: string; currency: string }>;
          for (const tier of tiers) {
            packages.push({
              id: `${addon.id}-${tier.minutes}`, // Unique ID for each tier
              minutes: tier.minutes,
              price: parseFloat(tier.price),
              name: `${addon.displayName} - ${tier.minutes} minutes`,
            });
          }
        } else {
          // Fallback: use flatPrice and metadata
          const metadata = (addon.metadata as { minutes?: number }) || {};
          const minutes = metadata.minutes || 0;
          const price = parseFloat(addon.flatPrice || '0');
          
          if (minutes > 0 && price > 0) {
            packages.push({
              id: addon.id,
              minutes,
              price,
              name: addon.displayName,
            });
          }
        }
      }
      
      res.json({ packages });
    } catch (error: any) {
      console.error("Get session minutes packages error:", error);
      res.status(500).json({ message: "Failed to fetch session minutes packages", error: error.message });
    }
  });

  // Validate promo code (with category support)
  app.post("/api/promo-codes/validate", authenticateToken, async (req: Request, res: Response) => {
    console.log('[Promo Code Validation] Endpoint hit with body:', req.body);
    try {
      const { code, category, planType } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Promo code is required", valid: false });
      }

      const promoCode = await authStorage.validatePromoCode(code, planType);

      if (!promoCode) {
        console.log('[Promo Code Validation] Code not found or expired:', code);
        return res.status(400).json({
          message: "Invalid or expired promo code",
          valid: false
        });
      }

      // Check for plan type mismatch
      if ((promoCode as any).planTypeMismatch) {
        const allowedTypes = (promoCode as any).allowedPlanTypes || [];
        const planTypeNames: Record<string, string> = {
          'yearly': '1-Year',
          'three_year': '3-Year',
          'monthly': 'Monthly',
          'six_month': '6-Month',
          'free_trial': 'Free Trial'
        };
        const allowedNames = allowedTypes.map((t: string) => planTypeNames[t] || t).join(', ');
        return res.status(400).json({
          message: `This promo code is only valid for ${allowedNames} plan${allowedTypes.length > 1 ? 's' : ''}.`,
          valid: false,
          planTypeMismatch: true,
          allowedPlanTypes: allowedTypes
        });
      }

      // Validate category if provided
      if (category && promoCode.category && promoCode.category !== category) {
        // Use category mapping to handle aliases (e.g., 'service' -> 'train_me')
        const categoryMap: Record<string, string> = {
          'platform_access': 'platform_subscription',
          'platform_subscription': 'platform_subscription',
          'session_minutes': 'session_minutes',
          'usage_bundle': 'session_minutes',
          'train_me': 'train_me',
          'dai': 'dai',
          'service': 'train_me', // Map 'service' to 'train_me' for Train Me purchases
        };
        
        const mappedPromoCategory = categoryMap[promoCode.category] || promoCode.category;
        const mappedItemCategory = categoryMap[category] || category;
        
        // Check if categories match after mapping
        if (mappedPromoCategory !== mappedItemCategory) {
          // Provide user-friendly category names
          const categoryNames: Record<string, string> = {
            'train_me': 'Train Me',
            'dai': 'Domain AI Intelligence',
            'service': 'Train Me',
            'session_minutes': 'Session Minutes',
            'platform_subscription': 'Platform Access',
          };
          
          const friendlyPromoCategory = categoryNames[promoCode.category] || promoCode.category;
          const friendlyItemCategory = categoryNames[category] || category;
          
          return res.status(400).json({
            message: `This promo code is only valid for ${friendlyPromoCategory} purchases, not ${friendlyItemCategory}.`,
            valid: false,
            invalidCategory: true,
            expectedCategory: promoCode.category,
            providedCategory: category
          });
        }
      }

      const discountMessage = promoCode.discountType === 'percentage'
        ? `${promoCode.discountValue}% discount applied!`
        : `$${promoCode.discountValue} discount applied!`;

      const response = {
        valid: true,
        promoCode: {
          code: promoCode.code,
          category: promoCode.category,
          allowedPlanTypes: promoCode.allowedPlanTypes,
          discountType: promoCode.discountType,
          discountValue: parseFloat(promoCode.discountValue),
        },
        message: discountMessage
      };

      console.log('[Promo Code Validation] Success:', response);
      res.json(response);
    } catch (error) {
      console.error("Validate promo code error:", error);
      res.status(500).json({ message: "Failed to validate promo code", valid: false });
    }
  });

  // Create order for session minutes purchase
  app.post("/api/session-minutes/create-order", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        packageId: z.string(),
        promoCode: z.string().optional(),
        paymentGateway: z.enum(['cashfree', 'razorpay']).optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { packageId, promoCode, paymentGateway: requestedGateway } = validation.data;
      
      // Use requested gateway or fall back to configured default
      const paymentGateway = requestedGateway || DEFAULT_PAYMENT_GATEWAY;
      
      console.log(`[Cart Checkout] requestedGateway: ${requestedGateway || 'undefined'}`);
      console.log(`[Cart Checkout] DEFAULT_PAYMENT_GATEWAY: ${DEFAULT_PAYMENT_GATEWAY}`);
      console.log(`[Cart Checkout] Final paymentGateway: ${paymentGateway}`);

      // Get package/addon by ID
      const pkg = await getPackageOrAddonBySku(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Verify it's a session minutes package
      const addonType = await getAddonTypeFromSku(packageId);
      if (addonType !== 'usage_bundle') {
        return res.status(400).json({ message: "Invalid package type for session minutes" });
      }

      // Calculate price with promo code if provided
      let finalPrice = pkg.price;
      let discountAmount = 0;
      let validatedPromo: any = null;
      if (promoCode) {
        const promo = await authStorage.validatePromoCode(promoCode);
        if (promo) {
          // Validate promo code MUST have a category
          if (!promo.category || promo.category.trim() === '') {
            return res.status(400).json({ 
              message: "Invalid promo code configuration" 
            });
          }

          // Validate promo code category matches the purchase type
          if (promo.category !== 'all') {
            const validCategories = ['session_minutes', 'usage_bundle'];
            if (!validCategories.includes(promo.category)) {
              return res.status(400).json({ 
                message: `This promo code is only valid for ${promo.category} purchases, not session minutes.` 
              });
            }
          }
          
          validatedPromo = promo;
          if (promo.discountType === 'percentage') {
            discountAmount = finalPrice * (parseFloat(promo.discountValue) / 100);
          } else {
            discountAmount = parseFloat(promo.discountValue);
          }
          finalPrice = Math.max(0, finalPrice - discountAmount);
        } else {
          return res.status(400).json({ message: "Invalid or expired promo code" });
        }
      }

      // CHECK FOR 100% DISCOUNT - Skip payment gateway if price is 0
      if (finalPrice <= 0) {
        console.log(`[Session Minutes] 🎉 100% discount applied! Price: ${finalPrice}. Skipping payment gateway.`);
        
        // Get user's organization ID
        const organizationId = await authStorage.getUserOrganizationId(userId);
        
        // Create the session minutes purchase directly (no payment needed)
        const purchase = await billingStorage.createAddonPurchase({
          userId,
          organizationId,
          addonType: 'session_minutes',
          packageSku: packageId,
          totalUnits: pkg.totalUnits || 0,
          usedUnits: 0,
          purchaseAmount: '0.00',
          currency: pkg.currency || 'USD',
          billingType: 'one-time',
          autoRenew: false,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 31 days validity
          metadata: {
            packageName: pkg.name,
            freePromo: true,
            promoCode: promoCode || null,
            originalPrice: pkg.price.toString(),
            discountAmount: discountAmount.toString(),
          },
        });

        // Create payment record with status 'succeeded' (amount: 0)
        await authStorage.createPayment({
          userId,
          razorpayOrderId: `FREE-SM-${Date.now()}`,
          razorpayPaymentId: `free_${Date.now()}`,
          amount: '0.00',
          currency: pkg.currency || 'USD',
          status: 'succeeded',
          paymentMethod: 'promo_code_100%',
          metadata: {
            type: 'session_minutes',
            packageSku: packageId,
            purchaseId: purchase.id,
            freePromo: true,
          },
        });

        // Increment promo code usage if applicable
        if (validatedPromo) {
          await authStorage.incrementPromoCodeUses(validatedPromo.id);
        }

        console.log(`[Session Minutes] ✅ Free purchase completed: ${pkg.totalUnits} minutes added`);

        // Return success response (no payment gateway needed)
        return res.json({
          success: true,
          freeOrder: true,
          message: "Session minutes added successfully with 100% discount!",
          purchase: {
            id: purchase.id,
            packageName: pkg.name,
            minutes: pkg.totalUnits,
            expiryDate: purchase.endDate,
          },
        });
      }

      // REGULAR PAYMENT FLOW (when price > 0)

      // Get user info for payment gateway
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create pending order
      const pendingOrder = await billingStorage.createPendingOrder({
        userId,
        packageSku: packageId,
        addonType: 'session_minutes',
        amount: finalPrice.toFixed(2),
        currency: pkg.currency || 'USD',
        gatewayOrderId: '',
        gatewayProvider: paymentGateway,
        status: 'pending',
        metadata: {
          packageName: pkg.name,
          packageMinutes: pkg.totalUnits || 0,
          originalPrice: pkg.price.toString(),
          discountAmount: discountAmount.toString(),
          promoCode: promoCode || null,
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });

      // Create payment gateway order
      const gateway = PaymentGatewayFactory.getGateway(paymentGateway);
      const baseUrl = getBaseUrl(req);
      
      // Real-time currency conversion for Cashfree (only supports INR)
      let finalCurrency = pkg.currency || 'USD';
      let finalAmount = finalPrice;
      let conversionInfo = null;
      
      if (paymentGateway === 'cashfree' && finalCurrency === 'USD') {
        try {
          const conversion = await currencyConverter.convertCurrency(finalPrice, 'USD', 'INR');
          finalAmount = conversion.convertedAmount;
          finalCurrency = 'INR';
          conversionInfo = conversion;
          console.log(`[Cashfree] Converted ${conversion.originalAmount} USD to ${conversion.convertedAmount} INR (rate: ${conversion.exchangeRate})`);
        } catch (error) {
          console.error(`[Cashfree] Currency conversion failed:`, error);
          return res.status(500).json({ 
            message: "Currency conversion failed. Please try again later.",
            error: "CURRENCY_CONVERSION_ERROR"
          });
        }
      }

      const order = await gateway.createOrder({
        amount: finalAmount,
        currency: finalCurrency,
        receipt: `SM-${pendingOrder.id.substring(0, 32)}`,
        metadata: {
          userId,
          packageSku: packageId,
          addonType: 'session_minutes',
          pendingOrderId: pendingOrder.id,
          returnUrl: `${baseUrl}/payment/success?orderId=${pendingOrder.id}&type=sessionminutes`,
          notifyUrl: `${baseUrl}/api/billing/webhook`,
        },
        customerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || 'customer@example.com',
        customerPhone: user.mobile || '9999999999',
      });

      // Update pending order with gateway order ID
      await billingStorage.updatePendingOrderGatewayId(pendingOrder.id, order.providerOrderId);

      // Log gateway transaction
      const gatewayProvider = await billingStorage.getGatewayProviderByName(gateway.getProviderName());
      if (gatewayProvider) {
        await billingStorage.createGatewayTransaction({
          providerId: gatewayProvider.id,
          providerTransactionId: order.providerOrderId,
          transactionType: 'order',
          status: order.status,
          amount: finalAmount.toFixed(2),
          currency: finalCurrency,
          userId,
          relatedEntity: 'pending_order',
          payload: order.metadata,
          metadata: { packageSku: packageId, pendingOrderId: pendingOrder.id },
        });
      }

      // Return response based on gateway
      if (paymentGateway === 'razorpay') {
        res.json({
          orderId: pendingOrder.id,
          razorpayOrderId: order.providerOrderId,
          razorpayKeyId: getRazorpayKeyId(),
          packageName: pkg.name,
          amount: finalAmount,
          currency: finalCurrency,
        });
      } else {
        res.json({
          orderId: pendingOrder.id,
          paymentSessionId: order.paymentSessionId,
          gatewayOrderId: order.providerOrderId,
          packageName: pkg.name,
          amount: finalAmount,
          currency: finalCurrency,
          cashfreeMode: getCashfreeMode(), // Tell frontend which mode to use
          cashfreeEnvironment: getCashfreeMode(), // Alias for compatibility
        });
      }
    } catch (error: any) {
      console.error("Create session minutes order error:", error);
      res.status(500).json({ message: error.message || "Failed to create order" });
    }
  });

  // Verify session minutes purchase payment
  app.post("/api/session-minutes/verify-payment", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      console.log(`[Session Minutes Verify] Processing verification for user: ${userId}`);
      
      const validation = z.object({
        orderId: z.string(), // Rev Winner pending order ID
        razorpay_payment_id: z.string().optional(),
        razorpay_order_id: z.string().optional(),
        razorpay_signature: z.string().optional(),
        cfPaymentId: z.string().optional(), // Cashfree payment ID
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { orderId, razorpay_payment_id, razorpay_signature, cfPaymentId } = validation.data;

      // Get pending order
      const pendingOrder = await billingStorage.getPendingOrder(orderId);
      if (!pendingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate order belongs to user
      if (pendingOrder.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate order is still pending
      if (pendingOrder.status !== 'pending') {
        return res.status(400).json({ message: `Order already ${pendingOrder.status}` });
      }

      // Validate order not expired
      if (new Date() > new Date(pendingOrder.expiresAt)) {
        await billingStorage.updatePendingOrderStatus(orderId, userId, 'expired');
        return res.status(400).json({ message: "Order has expired" });
      }

      // Validate addon type
      if (pendingOrder.addonType !== 'session_minutes') {
        console.error(`[Session Minutes Verify] Invalid order type: ${pendingOrder.addonType}, expected: session_minutes, orderId: ${orderId}`);
        
        // If this is a cart checkout order, provide helpful error
        if (pendingOrder.addonType === 'cart_checkout') {
          return res.status(400).json({ 
            message: "This order should be verified using the cart verification endpoint", 
            correctEndpoint: "/api/cart/verify",
            orderType: pendingOrder.addonType,
            orderId: orderId
          });
        }
        
        return res.status(400).json({ 
          message: "Invalid order type for session minutes verification", 
          expected: "session_minutes",
          actual: pendingOrder.addonType,
          orderId: orderId
        });
      }

      // Get package details
      const pkg = await getPackageOrAddonBySku(pendingOrder.packageSku);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package in order" });
      }

      // Verify payment with gateway
      const gateway = PaymentGatewayFactory.getGateway(pendingOrder.gatewayProvider as PaymentGatewayProvider);
      const gatewayOrderId = pendingOrder.gatewayOrderId;
      
      if (!gatewayOrderId) {
        return res.status(400).json({ message: "Gateway order ID not found" });
      }

      let isPaid = false;
      let verifiedPaymentId: string | undefined;
      let paymentStatus: any;

      if (pendingOrder.gatewayProvider === 'razorpay') {
        if (!razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ message: "Missing Razorpay verification data" });
        }
        
        // Verify signature
        const signatureValid = gateway.verifyPaymentSignature(gatewayOrderId, razorpay_payment_id, razorpay_signature);
        if (!signatureValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
        
        // Double-check payment status
        paymentStatus = await gateway.getPaymentStatus(razorpay_payment_id);
        isPaid = paymentStatus.status === 'captured' || paymentStatus.status === 'authorized';
        verifiedPaymentId = razorpay_payment_id;
      } else {
        // Cashfree uses API-based verification
        paymentStatus = await gateway.getPaymentStatus(gatewayOrderId);
        isPaid = paymentStatus.status === 'PAID' || 
                 paymentStatus.status === 'SUCCESS' || 
                 paymentStatus.status === 'captured';
        verifiedPaymentId = cfPaymentId || paymentStatus.paymentId;
        
        // SECURITY: Payment bypass removed for production safety
        // For testing, use Cashfree sandbox test cards instead
        console.log(`[Payment Verification] Status: ${paymentStatus.status}, isPaid: ${isPaid}`);
      }

      if (!isPaid) {
        // DON'T mark as failed immediately - payment might still be processing
        // Only return error. Order will expire naturally after 30 minutes if not paid.
        console.log(`[Session Minutes Verify] Payment not yet completed. Status: ${paymentStatus.status}`);
        return res.status(400).json({ 
          message: "Payment not yet completed. Please wait and try again.",
          status: paymentStatus.status
        });
      }

      // Check if user already has an active session minutes purchase
      // Due to unique constraint, we need to add minutes to existing purchase instead of creating new one
      const existingPurchase = await billingStorage.getActiveAddonPurchase(userId, 'session_minutes');
      
      let purchase: AddonPurchase;
      const newMinutes = pkg.totalUnits || 0;
      const startDate = new Date();
      const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : null;

      if (existingPurchase) {
        // Add minutes to existing purchase
        const currentTotalUnits = existingPurchase.totalUnits || 0;
        const currentUsedUnits = existingPurchase.usedUnits || 0;
        const newTotalUnits = currentTotalUnits + newMinutes;
        
        // Update existing purchase with additional minutes
        // Use the latest endDate (whichever is later)
        const existingEndDate = existingPurchase.endDate;
        const finalEndDate = existingEndDate && endDate 
          ? (existingEndDate > endDate ? existingEndDate : endDate)
          : (endDate || existingEndDate);

        // Update metadata to include this purchase
        const existingMetadata = (existingPurchase.metadata as any) || {};
        const purchaseHistory = Array.isArray(existingMetadata.purchaseHistory) 
          ? existingMetadata.purchaseHistory 
          : [];
        
        purchaseHistory.push({
          orderId: pendingOrder.id,
          packageSku: pendingOrder.packageSku,
          packageName: pkg.name,
          minutesAdded: newMinutes,
          amount: pendingOrder.amount, // This is the actual paid amount (INR)
          currency: pendingOrder.currency, // This is the actual currency (INR)
          gatewayOrderId: gatewayOrderId,
          paymentId: verifiedPaymentId,
          gatewayProvider: pendingOrder.gatewayProvider,
          purchasedAt: startDate.toISOString(),
        });

        // Update the purchase
        purchase = await db
          .update(addonPurchases)
          .set({
            totalUnits: newTotalUnits,
            // Keep usedUnits as is (don't reset it)
            endDate: finalEndDate,
            updatedAt: new Date(),
            metadata: {
              ...existingMetadata,
              purchaseHistory,
              lastPurchaseOrderId: pendingOrder.id,
              lastPurchaseDate: startDate.toISOString(),
            },
          })
          .where(eq(addonPurchases.id, existingPurchase.id))
          .returning()
          .then((result: AddonPurchase[]) => result[0]);

        console.log(`[Session Minutes] Added ${newMinutes} minutes to existing purchase. New total: ${newTotalUnits} minutes`);
      } else {
        // Create new purchase - but handle race condition where another request might have created one
        try {
          purchase = await billingStorage.createAddonPurchase({
            userId,
            addonType: 'session_minutes',
            packageSku: pendingOrder.packageSku,
            billingType: 'one_time',
            purchaseAmount: pendingOrder.amount, // Use actual paid amount (INR)
            currency: pendingOrder.currency, // Use actual currency (INR)
            totalUnits: newMinutes,
            usedUnits: 0,
            status: 'active',
            startDate,
            endDate,
            gatewayTransactionId: null,
            metadata: {
              packageName: pkg.name,
              gatewayOrderId: gatewayOrderId,
              paymentId: verifiedPaymentId,
              gatewayProvider: pendingOrder.gatewayProvider,
              pendingOrderId: pendingOrder.id,
              actualPaidAmount: pendingOrder.amount, // Store actual paid amount
              actualCurrency: pendingOrder.currency, // Store actual currency
              purchaseHistory: [{
                orderId: pendingOrder.id,
                packageSku: pendingOrder.packageSku,
                packageName: pkg.name,
                minutesAdded: newMinutes,
                amount: pendingOrder.amount, // Use actual paid amount (INR)
                currency: pendingOrder.currency, // Use actual currency (INR)
                gatewayOrderId: gatewayOrderId,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                purchasedAt: startDate.toISOString(),
              }],
            },
          });
          
          console.log(`[Session Minutes] Created new purchase with ${newMinutes} minutes`);
        } catch (error: any) {
          // Handle race condition: if another request created a purchase between our check and create
          if (error?.code === '23505' && error?.constraint === 'unique_active_addon_per_user') {
            console.log(`[Session Minutes] Race condition detected - another purchase was created. Retrying with update...`);
            
            // Re-check for existing purchase (it might have been created by another request)
            const retryExistingPurchase = await billingStorage.getActiveAddonPurchase(userId, 'session_minutes');
            
            if (retryExistingPurchase) {
              // Add minutes to the purchase that was just created
              const currentTotalUnits = retryExistingPurchase.totalUnits || 0;
              const newTotalUnits = currentTotalUnits + newMinutes;
              
              const existingEndDate = retryExistingPurchase.endDate;
              const finalEndDate = existingEndDate && endDate 
                ? (existingEndDate > endDate ? existingEndDate : endDate)
                : (endDate || existingEndDate);

              const existingMetadata = (retryExistingPurchase.metadata as any) || {};
              const purchaseHistory = Array.isArray(existingMetadata.purchaseHistory) 
                ? existingMetadata.purchaseHistory 
                : [];
            
              purchaseHistory.push({
                orderId: pendingOrder.id,
                packageSku: pendingOrder.packageSku,
                packageName: pkg.name,
                minutesAdded: newMinutes,
                amount: pendingOrder.amount, // Use actual paid amount (INR)
                currency: pendingOrder.currency, // Use actual currency (INR)
                gatewayOrderId: gatewayOrderId,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                purchasedAt: startDate.toISOString(),
              });

              purchase = await db
                .update(addonPurchases)
                .set({
                  totalUnits: newTotalUnits,
                  endDate: finalEndDate,
                  updatedAt: new Date(),
                  metadata: {
                    ...existingMetadata,
                    purchaseHistory,
                    lastPurchaseOrderId: pendingOrder.id,
                    lastPurchaseDate: startDate.toISOString(),
                  },
                })
                .where(eq(addonPurchases.id, retryExistingPurchase.id))
                .returning()
                .then((result: AddonPurchase[]) => result[0]);

              console.log(`[Session Minutes] Added ${newMinutes} minutes to existing purchase (race condition recovery). New total: ${newTotalUnits} minutes`);
            } else {
              // This shouldn't happen, but re-throw if it does
              throw error;
            }
          } else {
            // Re-throw if it's not the duplicate key error
            throw error;
          }
        }
      }

      // Create payment record for tracking and invoices
      // Get user's organization ID (if they have an active enterprise license)
      const organizationId = await authStorage.getUserOrganizationId(userId);
      
      // Check if payment record already exists (avoid duplicates)
      const existingPayment = await authStorage.getPaymentByRazorpayOrderId(gatewayOrderId);
      
      if (!existingPayment) {
        // Calculate amount in smallest unit (cents/paise)
        const amountInSmallestUnit = Math.round(parseFloat(pendingOrder.amount) * 100);
        
        // Create payment record
        await authStorage.createPayment({
          userId,
          organizationId,
          razorpayOrderId: gatewayOrderId,
          razorpayPaymentId: verifiedPaymentId,
          amount: amountInSmallestUnit.toString(),
          currency: pendingOrder.currency,
          status: 'succeeded',
          paymentMethod: pendingOrder.gatewayProvider || 'razorpay', // Track payment gateway
          metadata: {
            type: 'session_minutes',
            packageSku: pendingOrder.packageSku,
            packageName: pkg.name,
            minutes: newMinutes,
            orderId: pendingOrder.id,
            gatewayProvider: pendingOrder.gatewayProvider,
            // Include payment metadata
            displayAmount: (pendingOrder.metadata as any)?.displayAmount,
            displayCurrency: (pendingOrder.metadata as any)?.displayCurrency,
            actualAmount: (pendingOrder.metadata as any)?.actualAmount,
            actualCurrency: (pendingOrder.metadata as any)?.actualCurrency,
            exchangeRate: (pendingOrder.metadata as any)?.exchangeRate,
          },
        });
        
        console.log(`[Session Minutes] Payment record created for order ${pendingOrder.id}`);
      } else {
        console.log(`[Session Minutes] Payment record already exists for order ${gatewayOrderId}`);
      }

      // Mark pending order as completed
      await billingStorage.updatePendingOrderStatus(orderId, userId, 'completed', new Date());

      // Increment promo code usage if one was used
      const promoCodeUsed = (pendingOrder.metadata as any)?.promoCode;
      if (promoCodeUsed) {
        try {
          const promo = await authStorage.validatePromoCode(promoCodeUsed);
          if (promo) {
            await authStorage.incrementPromoCodeUses(promo.id);
            console.log(`[Promo Code] Incremented usage for code: ${promoCodeUsed}`);
          }
        } catch (error) {
          console.error(`[Promo Code] Failed to increment usage for code: ${promoCodeUsed}`, error);
          // Don't fail the purchase if promo code increment fails
        }
      }

      // Refresh user entitlements
      await billingStorage.refreshUserEntitlements(userId);

      res.json({
        success: true,
        purchase,
        minutesAdded: newMinutes, // Include minutes added for frontend display
        message: "Session minutes purchased successfully",
      });
    } catch (error: any) {
      console.error("Verify session minutes payment error:", error);
      res.status(500).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // Get session minutes status for current user (individual or org seat: org members see organization's pool)
  app.get("/api/session-minutes/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Check if user is super user (unlimited access)
      const user = await authStorage.getUserById(userId);
      const isSuperUser = user?.role === 'super_admin' || (req as any).jwtUser?.superUser === true;
      
      if (isSuperUser) {
        return res.json({
          hasActiveMinutes: true,
          totalMinutesRemaining: Infinity,
          totalMinutes: Infinity,
          usedMinutes: 0,
          nextExpiryDate: null,
          superUserAccess: true,
          hasPurchasedPackages: true,
        });
      }
      
      // Check if user is an org member with active enterprise seat → use organization's session minutes
      let membership = await authStorage.getUserMembership(userId);
      // Fix: assigned users who never got org membership (e.g. assigned before we created membership on assign)
      if (!membership) {
        membership = await authStorage.ensureOrganizationMembershipFromAssignment(userId) || null;
      }
      const licensePackage = membership && membership.status === 'active'
        ? await authStorage.getActiveLicensePackage(membership.organizationId)
        : null;
      const isOrgSeatUser = !!(membership && membership.status === 'active' && licensePackage);

      let balance: { totalMinutes: number; usedMinutes: number; remainingMinutes: number; expiresAt: Date | null };
      let hasPurchasedPackages: boolean;

      if (isOrgSeatUser && membership) {
        balance = await billingStorage.getSessionMinutesBalanceByOrganization(membership.organizationId);
        hasPurchasedPackages = true; // Org seat users use team subscription; show same UI as individual with plan
        console.log(`[Session Minutes] Org seat user ${userId} - Org ${membership.organizationId} balance: ${balance.totalMinutes} total, ${balance.remainingMinutes} remaining`);
      } else {
        balance = await billingStorage.getSessionMinutesBalance(userId);
        const purchasedPackages = await db
          .select()
          .from(addonPurchases)
          .where(
            and(
              eq(addonPurchases.userId, userId),
              eq(addonPurchases.addonType, 'session_minutes')
            )
          );
        hasPurchasedPackages = purchasedPackages.length > 0;
      }
      
      // Get subscription data for trial minutes (only for non-org users)
      let subscription = await authStorage.getSubscriptionByUserId(userId);
      
      if (!subscription && !isOrgSeatUser) {
        console.log(`[Session Minutes] No subscription found for user ${userId}, creating free trial`);
        subscription = await authStorage.createSubscription({
          userId,
          planType: 'free_trial',
          status: 'trial',
          sessionsUsed: '0',
          sessionsLimit: '3',
          minutesUsed: '0',
          minutesLimit: '180',
          sessionHistory: [],
        });
      }
      
      // Calculate total minutes: purchased + trial (for individual); for org seat use org balance only
      let totalMinutes = balance.totalMinutes;
      
      if (!isOrgSeatUser) {
        console.log(`[Session Minutes] User ${userId} - Purchased: ${balance.totalMinutes}, Subscription: ${subscription?.minutesLimit}, Has Packages: ${hasPurchasedPackages}`);
        if (subscription?.planType === 'free_trial' && subscription.minutesLimit) {
          const trialMinutes = subscription.minutesLimit === 'unlimited' ? 0 : parseInt(subscription.minutesLimit || '0');
          totalMinutes += trialMinutes;
          console.log(`[Session Minutes] Added ${trialMinutes} trial minutes, total now: ${totalMinutes}`);
        }
      }
      
      // Calculate actual used minutes from session_usage table (source of truth for timing)
      let actualUsedMinutes = 0;
      try {
        const userSessions = await db
          .select()
          .from(sessionUsage)
          .where(and(
            eq(sessionUsage.userId, userId),
            eq(sessionUsage.status, "ended")
          ));
        
        actualUsedMinutes = userSessions.reduce((total, session) => {
          const durationSeconds = parseInt(session.durationSeconds || '0');
          const durationMinutes = Math.floor(durationSeconds / 60);
          return total + durationMinutes;
        }, 0);
        
        console.log(`[Session Minutes Status] User ${userId}: ${actualUsedMinutes} minutes used from session_usage table (Total: ${totalMinutes}, Remaining: ${isOrgSeatUser ? balance.remainingMinutes : Math.max(0, totalMinutes - actualUsedMinutes)}, Has packages: ${hasPurchasedPackages})`);
      } catch (error) {
        console.error('[Session Minutes Status] Error calculating used minutes:', error);
        actualUsedMinutes = subscription?.minutesUsed ? parseInt(subscription.minutesUsed) : 0;
      }
      
      const remainingMinutes = isOrgSeatUser
        ? balance.remainingMinutes
        : Math.max(0, totalMinutes - actualUsedMinutes);
      
      res.json({
        hasActiveMinutes: remainingMinutes > 0,
        totalMinutesRemaining: remainingMinutes,
        totalMinutes: totalMinutes,
        usedMinutes: isOrgSeatUser ? balance.usedMinutes : actualUsedMinutes,
        nextExpiryDate: balance.expiresAt ? balance.expiresAt.toISOString() : null,
        superUserAccess: false,
        hasPurchasedPackages: hasPurchasedPackages,
      });
    } catch (error: any) {
      console.error("Get session minutes status error:", error);
      res.status(500).json({ message: "Failed to fetch session minutes status", error: error.message });
    }
  });

  // ========================================
  // TRAIN ME ADD-ON
  // ========================================

  // Create order for Train Me purchase
  app.post("/api/train-me/create-order", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        paymentGateway: z.enum(['cashfree', 'razorpay']).optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { paymentGateway: requestedGateway } = validation.data;
      
      // Use requested gateway or fall back to configured default
      const paymentGateway = requestedGateway || DEFAULT_PAYMENT_GATEWAY;

      // Find Train Me addon by slug
      const publishedAddons = await billingStorage.getPublishedAddons();
      const trainMeAddon = publishedAddons.find(a => a.slug === 'train-me' || a.slug === 'train_me');
      
      if (!trainMeAddon) {
        return res.status(404).json({ message: "Train Me addon not found. Please contact support." });
      }

      // Get package details
      const pkg = await getPackageOrAddonBySku(trainMeAddon.id);
      if (!pkg) {
        return res.status(400).json({ message: "Train Me package not available" });
      }

      // Get user info for payment gateway
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create pending order
      const pendingOrder = await billingStorage.createPendingOrder({
        userId,
        packageSku: trainMeAddon.id,
        addonType: 'train_me',
        amount: pkg.price.toFixed(2),
        currency: pkg.currency || 'USD',
        gatewayOrderId: '',
        gatewayProvider: paymentGateway,
        status: 'pending',
        metadata: {
          packageName: pkg.name,
          originalPrice: pkg.price.toString(),
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });

      // Create payment gateway order
      const gateway = PaymentGatewayFactory.getGateway(paymentGateway);
      const baseUrl = getBaseUrl(req);
      
      // IMPORTANT: Use INR for Cashfree (only supports INR), USD for Razorpay
      let finalCurrency = paymentGateway === 'cashfree' ? 'INR' : (pkg.currency || 'USD');
      let finalAmount = pkg.price;
      let conversionInfo = null;
      
      // Real-time currency conversion for Cashfree
      if (paymentGateway === 'cashfree' && (pkg.currency === 'USD' || !pkg.currency)) {
        try {
          const conversion = await currencyConverter.convertCurrency(pkg.price, 'USD', 'INR');
          finalAmount = conversion.convertedAmount;
          finalCurrency = 'INR';
          conversionInfo = conversion;
          console.log(`[Train Me Cashfree] Converted ${conversion.originalAmount} USD to ${conversion.convertedAmount} INR (rate: ${conversion.exchangeRate})`);
        } catch (error) {
          console.error(`[Train Me Cashfree] Currency conversion failed:`, error);
          return res.status(500).json({ 
            message: "Currency conversion failed. Please try again later.",
            error: "CURRENCY_CONVERSION_ERROR"
          });
        }
      }

      const order = await gateway.createOrder({
        amount: finalAmount,
        currency: finalCurrency,
        receipt: `TM-${pendingOrder.id.substring(0, 32)}`,
        metadata: {
          userId,
          packageSku: trainMeAddon.id,
          addonType: 'train_me',
          pendingOrderId: pendingOrder.id,
          returnUrl: `${baseUrl}/payment/success?orderId=${pendingOrder.id}&type=trainme`,
          notifyUrl: `${baseUrl}/api/billing/webhook`,
        },
        customerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || 'customer@example.com',
        customerPhone: user.mobile || '9999999999',
      });

      // Update pending order with gateway order ID
      await billingStorage.updatePendingOrderGatewayId(pendingOrder.id, order.providerOrderId);

      // Log gateway transaction
      const gatewayProvider = await billingStorage.getGatewayProviderByName(gateway.getProviderName());
      if (gatewayProvider) {
        await billingStorage.createGatewayTransaction({
          providerId: gatewayProvider.id,
          providerTransactionId: order.providerOrderId,
          transactionType: 'order',
          status: order.status,
          amount: finalAmount.toFixed(2),
          currency: finalCurrency,
          userId,
          relatedEntity: 'pending_order',
          payload: order.metadata,
          metadata: { packageSku: trainMeAddon.id, pendingOrderId: pendingOrder.id },
        });
      }

      // Return response based on gateway
      if (paymentGateway === 'razorpay') {
        res.json({
          orderId: pendingOrder.id,
          razorpayOrderId: order.providerOrderId,
          razorpayKeyId: getRazorpayKeyId(),
          packageName: pkg.name,
          amount: finalAmount,
          currency: finalCurrency,
        });
      } else {
        res.json({
          orderId: pendingOrder.id,
          paymentSessionId: order.paymentSessionId,
          gatewayOrderId: order.providerOrderId,
          packageName: pkg.name,
          amount: finalAmount,
          currency: finalCurrency,
          cashfreeMode: getCashfreeMode(),
          cashfreeEnvironment: getCashfreeMode(),
        });
      }
    } catch (error: any) {
      console.error("Create Train Me order error:", error);
      res.status(500).json({ message: error.message || "Failed to create order" });
    }
  });

  // Verify Train Me purchase payment
  app.post("/api/train-me/verify-payment", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        orderId: z.string(), // Rev Winner pending order ID
        razorpay_payment_id: z.string().optional(),
        razorpay_order_id: z.string().optional(),
        razorpay_signature: z.string().optional(),
        cfPaymentId: z.string().optional(), // Cashfree payment ID
        cashfreeOrderId: z.string().optional(), // Cashfree order ID
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { orderId, razorpay_payment_id, razorpay_signature, cfPaymentId, cashfreeOrderId } = validation.data;

      // Get pending order
      const pendingOrder = await billingStorage.getPendingOrder(orderId);
      if (!pendingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate order belongs to user
      if (pendingOrder.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate order is still pending
      if (pendingOrder.status !== 'pending') {
        return res.status(400).json({ message: `Order already ${pendingOrder.status}` });
      }

      // Validate order not expired
      if (new Date() > new Date(pendingOrder.expiresAt)) {
        await billingStorage.updatePendingOrderStatus(orderId, userId, 'expired');
        return res.status(400).json({ message: "Order has expired" });
      }

      // Validate addon type
      if (pendingOrder.addonType !== 'train_me') {
        console.error(`[Train Me Verify] Invalid order type: ${pendingOrder.addonType}, expected: train_me, orderId: ${orderId}`);
        
        // If this is a cart checkout order, provide helpful error
        if (pendingOrder.addonType === 'cart_checkout') {
          return res.status(400).json({ 
            message: "This order should be verified using the cart verification endpoint", 
            correctEndpoint: "/api/cart/verify",
            orderType: pendingOrder.addonType,
            orderId: orderId
          });
        }
        
        return res.status(400).json({ 
          message: "Invalid order type for Train Me verification", 
          expected: "train_me",
          actual: pendingOrder.addonType,
          orderId: orderId
        });
      }

      // Get package details
      const pkg = await getPackageOrAddonBySku(pendingOrder.packageSku);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package in order" });
      }

      // Verify payment with gateway
      const gateway = PaymentGatewayFactory.getGateway(pendingOrder.gatewayProvider as PaymentGatewayProvider);
      const gatewayOrderId = pendingOrder.gatewayOrderId;
      
      if (!gatewayOrderId) {
        return res.status(400).json({ message: "Gateway order ID not found" });
      }

      let isPaid = false;
      let verifiedPaymentId: string | undefined;
      let paymentStatus: any;

      if (pendingOrder.gatewayProvider === 'razorpay') {
        if (!razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ message: "Missing Razorpay verification data" });
        }
        
        // Verify signature
        const signatureValid = gateway.verifyPaymentSignature(gatewayOrderId, razorpay_payment_id, razorpay_signature);
        if (!signatureValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
        
        // Double-check payment status
        paymentStatus = await gateway.getPaymentStatus(razorpay_payment_id);
        isPaid = paymentStatus.status === 'captured' || paymentStatus.status === 'authorized';
        verifiedPaymentId = razorpay_payment_id;
      } else {
        // Cashfree uses API-based verification
        const verifyOrderId = cashfreeOrderId || gatewayOrderId;
        paymentStatus = await gateway.getPaymentStatus(verifyOrderId);
        isPaid = paymentStatus.status === 'PAID' || 
                 paymentStatus.status === 'SUCCESS' || 
                 paymentStatus.status === 'captured';
        verifiedPaymentId = cfPaymentId || paymentStatus.paymentId;
      }

      if (!isPaid) {
        // DON'T mark as failed immediately - payment might still be processing
        console.log(`[Train Me Verify] Payment not yet completed. Status: ${paymentStatus.status}`);
        return res.status(400).json({ 
          message: "Payment not yet completed. Please wait and try again.",
          status: paymentStatus.status
        });
      }

      // Check if user already has an active Train Me purchase
      // Due to unique constraint, we need to extend existing purchase instead of creating new one
      const existingPurchase = await billingStorage.getActiveAddonPurchase(userId, 'train_me');
      
      let purchase: AddonPurchase;
      const startDate = new Date();
      const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : calculateEndDate(startDate, 30); // Default 30 days

      if (existingPurchase) {
        // Extend existing purchase
        const existingEndDate = existingPurchase.endDate;
        const finalEndDate = existingEndDate && endDate 
          ? (existingEndDate > endDate ? existingEndDate : endDate)
          : (endDate || existingEndDate);

        // Update metadata to include this purchase
        const existingMetadata = (existingPurchase.metadata as any) || {};
        const purchaseHistory = Array.isArray(existingMetadata.purchaseHistory) 
          ? existingMetadata.purchaseHistory 
          : [];
        
        purchaseHistory.push({
          orderId: pendingOrder.id,
          packageSku: pendingOrder.packageSku,
          packageName: pkg.name,
          amount: pendingOrder.amount,
          currency: pendingOrder.currency,
          gatewayOrderId: gatewayOrderId,
          paymentId: verifiedPaymentId,
          gatewayProvider: pendingOrder.gatewayProvider,
          purchasedAt: startDate.toISOString(),
        });

        // Update the purchase
        purchase = await db
          .update(addonPurchases)
          .set({
            endDate: finalEndDate,
            updatedAt: new Date(),
            metadata: {
              ...existingMetadata,
              purchaseHistory,
              lastPurchaseOrderId: pendingOrder.id,
              lastPurchaseDate: startDate.toISOString(),
            },
          })
          .where(eq(addonPurchases.id, existingPurchase.id))
          .returning()
          .then((result: AddonPurchase[]) => result[0]);

        console.log(`[Train Me] Extended existing purchase. New end date: ${finalEndDate}`);
      } else {
        // Create new purchase
        try {
          purchase = await billingStorage.createAddonPurchase({
            userId,
            addonType: 'train_me',
            packageSku: pendingOrder.packageSku,
            billingType: 'one_time',
            purchaseAmount: pendingOrder.amount,
            currency: pendingOrder.currency,
            totalUnits: 0, // Train Me doesn't use units
            usedUnits: 0,
            status: 'active',
            startDate,
            endDate,
            gatewayTransactionId: null,
            metadata: {
              packageName: pkg.name,
              gatewayOrderId: gatewayOrderId,
              paymentId: verifiedPaymentId,
              gatewayProvider: pendingOrder.gatewayProvider,
              pendingOrderId: pendingOrder.id,
              purchaseHistory: [{
                orderId: pendingOrder.id,
                packageSku: pendingOrder.packageSku,
                packageName: pkg.name,
                amount: pendingOrder.amount,
                currency: pendingOrder.currency,
                gatewayOrderId: gatewayOrderId,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                purchasedAt: startDate.toISOString(),
              }],
            },
          });
          
          console.log(`[Train Me] Created new purchase`);
        } catch (error: any) {
          // Handle race condition
          if (error?.code === '23505' && error?.constraint === 'unique_active_addon_per_user') {
            console.log(`[Train Me] Race condition detected - another purchase was created. Retrying with update...`);
            
            const retryExistingPurchase = await billingStorage.getActiveAddonPurchase(userId, 'train_me');
            
            if (retryExistingPurchase) {
              const existingEndDate = retryExistingPurchase.endDate;
              const finalEndDate = existingEndDate && endDate 
                ? (existingEndDate > endDate ? existingEndDate : endDate)
                : (endDate || existingEndDate);

              const existingMetadata = (retryExistingPurchase.metadata as any) || {};
              const purchaseHistory = Array.isArray(existingMetadata.purchaseHistory) 
                ? existingMetadata.purchaseHistory 
                : [];
            
              purchaseHistory.push({
                orderId: pendingOrder.id,
                packageSku: pendingOrder.packageSku,
                packageName: pkg.name,
                amount: pendingOrder.amount,
                currency: pendingOrder.currency,
                gatewayOrderId: gatewayOrderId,
                paymentId: verifiedPaymentId,
                gatewayProvider: pendingOrder.gatewayProvider,
                purchasedAt: startDate.toISOString(),
              });

              purchase = await db
                .update(addonPurchases)
                .set({
                  endDate: finalEndDate,
                  updatedAt: new Date(),
                  metadata: {
                    ...existingMetadata,
                    purchaseHistory,
                    lastPurchaseOrderId: pendingOrder.id,
                    lastPurchaseDate: startDate.toISOString(),
                  },
                })
                .where(eq(addonPurchases.id, retryExistingPurchase.id))
                .returning()
                .then((result: AddonPurchase[]) => result[0]);

              console.log(`[Train Me] Extended existing purchase (race condition recovery). New end date: ${finalEndDate}`);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      // Mark pending order as completed
      await billingStorage.updatePendingOrderStatus(orderId, userId, 'completed', new Date());

      // Refresh user entitlements
      await billingStorage.refreshUserEntitlements(userId);

      res.json({
        success: true,
        purchase,
        message: "Train Me activated successfully",
      });
    } catch (error: any) {
      console.error("Verify Train Me payment error:", error);
      res.status(500).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // Get all available packages (Platform Access + Published Add-ons)
  app.get("/api/billing/packages", async (req: Request, res: Response) => {
    try {
      // Get published subscription plans and add-ons from database
      const publishedPlans = await billingStorage.getPublishedSubscriptionPlans();
      const publishedAddons = await billingStorage.getPublishedAddons();
      
      // Transform database subscription plans to frontend format
      const platformAccess = publishedPlans.map(plan => {
        // Map billingInterval to billingType enum
        let billingType: 'one_time' | 'monthly' | '6_months' | '12_months' | '36_months' = 'monthly';
        const interval = plan.billingInterval.toLowerCase();
        
        if (interval.includes('month') && !interval.includes('6') && !interval.includes('12') && !interval.includes('36')) {
          billingType = 'monthly';
        } else if (interval.includes('6')) {
          billingType = '6_months';
        } else if (interval.includes('12') || interval.includes('annual') || interval.includes('year') && !interval.includes('3')) {
          billingType = '12_months';
        } else if (interval.includes('36') || interval.includes('3')) {
          billingType = '36_months';
        }

        // Extract features array
        const features = Array.isArray(plan.features) ? plan.features as string[] : [];
        
        // Generate description from first feature or use a default
        const description = features.length > 0 
          ? features.join(', ')
          : `${plan.name} subscription`;

        // Calculate validity days from billing type
        const validityDaysMap: Record<string, number> = {
          'monthly': 30,
          '6_months': 180,
          '12_months': 365,
          '36_months': 1095,
        };

        return {
          sku: plan.id,
          name: plan.name,
          price: parseFloat(plan.price),
          listedPrice: plan.listedPrice ? parseFloat(plan.listedPrice) : null,
          currency: plan.currency,
          billingType,
          validityDays: validityDaysMap[billingType] || 30,
          description,
          features,
        };
      });
      
      res.json({
        platformAccess,
        addons: publishedAddons,
      });
    } catch (error) {
      console.error("Get packages error:", error);
      res.status(500).json({ message: "Failed to get packages" });
    }
  });

  // Get package by SKU
  app.get("/api/billing/packages/:sku", (req: Request, res: Response) => {
    try {
      const { sku } = req.params;
      const pkg = getPackageBySku(sku);

      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      res.json(pkg);
    } catch (error) {
      console.error("Get package error:", error);
      res.status(500).json({ message: "Failed to get package" });
    }
  });

  // ========================================
  // PLATFORM ACCESS SUBSCRIPTIONS
  // ========================================

  // Purchase platform access subscription (SECURE: Pending Orders Flow)
  app.post("/api/billing/platform-access/purchase", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = purchasePlatformAccessSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { packageSku, paymentGateway } = validation.data;
      const pkg = getPackageBySku(packageSku);

      if (!pkg || !packageSku.startsWith('RW-PA-')) {
        return res.status(400).json({ message: "Invalid platform access package" });
      }

      // Check if user already has an active platform access subscription
      const existingSubscription = await billingStorage.getActiveAddonPurchase(userId, 'platform_access');
      if (existingSubscription) {
        return res.status(400).json({ message: "You already have an active platform access subscription" });
      }

      // SECURITY FIX: Create pending order FIRST (single source of truth)
      const pendingOrder = await billingStorage.createPendingOrder({
        userId,
        packageSku,
        addonType: 'platform_access',
        amount: pkg.price.toString(),
        currency: pkg.currency,
        gatewayOrderId: '', // Will be updated after gateway order creation
        gatewayProvider: paymentGateway,
        status: 'pending',
        metadata: {
          packageName: pkg.name,
          packageDuration: pkg.validityDays,
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });

      // Create payment gateway order
      const gateway = PaymentGatewayFactory.getGateway(paymentGateway);
      const baseUrl = getBaseUrl(req);
      const order = await gateway.createOrder({
        amount: pkg.price,
        currency: pkg.currency,
        receipt: `PA-${pendingOrder.id.substring(0, 32)}`,
        metadata: {
          userId,
          packageSku,
          addonType: 'platform_access',
          pendingOrderId: pendingOrder.id,
          returnUrl: `${baseUrl}/payment/success?orderId=${pendingOrder.id}`,
          notifyUrl: `${baseUrl}/api/billing/webhook`,
        },
      });

      // Update pending order with gateway order ID
      await billingStorage.updatePendingOrderGatewayId(pendingOrder.id, order.providerOrderId);

      // Log gateway transaction
      const gatewayProvider = await billingStorage.getGatewayProviderByName(gateway.getProviderName());
      if (gatewayProvider) {
        await billingStorage.createGatewayTransaction({
          providerId: gatewayProvider.id,
          providerTransactionId: order.providerOrderId,
          transactionType: 'order',
          status: order.status,
          amount: pkg.price.toString(),
          currency: pkg.currency,
          userId,
          relatedEntity: 'pending_order',
          payload: order.metadata,
          metadata: { packageSku, pendingOrderId: pendingOrder.id },
        });
      }

      res.json({
        order,
        package: pkg,
        pendingOrderId: pendingOrder.id,
        keyId: paymentGateway === 'razorpay' ? getRazorpayKeyId() : undefined,
        amount: paymentGateway === 'razorpay' ? order.amount : pkg.price,
        currency: pkg.currency,
        orderId: order.providerOrderId,
      });
    } catch (error: any) {
      console.error("Purchase platform access error:", error);
      res.status(500).json({ message: error.message || "Failed to create purchase order" });
    }
  });

  // Verify and complete platform access purchase (SECURE: Validates pending order metadata)
  app.post("/api/billing/platform-access/verify", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { orderId, cfPaymentId } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // SECURITY FIX: Retrieve and validate pending order (single source of truth)
      const pendingOrder = await billingStorage.getPendingOrder(orderId);

      if (!pendingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate order belongs to user
      if (pendingOrder.userId !== userId) {
        console.error(`Security: User ${userId} attempted to complete order belonging to ${pendingOrder.userId}`);
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate order is still pending
      if (pendingOrder.status !== 'pending') {
        return res.status(400).json({ message: `Order already ${pendingOrder.status}` });
      }

      // Validate order not expired
      if (new Date() > new Date(pendingOrder.expiresAt)) {
        await billingStorage.updatePendingOrderStatus(orderId, userId, 'expired');
        return res.status(400).json({ message: "Order has expired" });
      }

      // Validate addon type matches
      if (pendingOrder.addonType !== 'platform_access') {
        console.error(`Security: Addon type mismatch. Expected platform_access, got ${pendingOrder.addonType}`);
        return res.status(400).json({ message: "Invalid addon type" });
      }

      // Get package from stored SKU (use pending order data, not client-supplied)
      const pkg = getPackageBySku(pendingOrder.packageSku);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package in pending order" });
      }

      // Validate amount matches stored order
      if (pkg.price.toString() !== pendingOrder.amount) {
        console.error(`Security: Amount mismatch. Expected ${pendingOrder.amount}, package has ${pkg.price}`);
        return res.status(400).json({ message: "Amount mismatch" });
      }

      // Verify payment status with gateway (API-based or signature-based)
      const gateway = PaymentGatewayFactory.getGateway(pendingOrder.gatewayProvider as PaymentGatewayProvider);
      const gatewayOrderId = pendingOrder.gatewayOrderId;
      
      if (!gatewayOrderId) {
        return res.status(400).json({ message: "Gateway order ID not found" });
      }

      let isPaid = false;
      let paymentId = cfPaymentId;
      let paymentStatus: any;

      if (pendingOrder.gatewayProvider === 'razorpay') {
        const { razorpayPaymentId, razorpaySignature } = req.body;
        if (!razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ message: "Missing Razorpay verification data" });
        }
        
        // Step 1: Verify signature using HMAC with stored gateway order ID
        const signatureValid = gateway.verifyPaymentSignature(gatewayOrderId, razorpayPaymentId, razorpaySignature);
        console.log(`Razorpay signature verification for order ${gatewayOrderId}: ${signatureValid}`);
        
        if (!signatureValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
        
        // Step 2: Double-check payment status from Razorpay API
        paymentStatus = await gateway.getPaymentStatus(razorpayPaymentId);
        console.log(`Razorpay payment status for ${razorpayPaymentId}:`, paymentStatus.status);
        
        isPaid = paymentStatus.status === 'captured' || paymentStatus.status === 'authorized';
        paymentId = razorpayPaymentId;
      } else {
        // Cashfree uses API-based verification
        paymentStatus = await gateway.getPaymentStatus(gatewayOrderId);
        isPaid = paymentStatus.status === 'PAID' || 
                 paymentStatus.status === 'SUCCESS' || 
                 paymentStatus.status === 'captured';
        paymentId = cfPaymentId || paymentStatus.metadata?.cf_payment_id;
      }

      if (!isPaid) {
        // DON'T mark as failed immediately - payment might still be processing
        console.log(`[Platform Access Verify] Payment not yet completed`);
        return res.status(400).json({ 
          message: "Payment not yet completed. Please wait and try again."
        });
      }

      // Create addon purchase using validated pending order data
      const startDate = new Date();
      const endDate = pkg.validityDays ? calculateEndDate(startDate, pkg.validityDays) : null;

      const purchase = await billingStorage.createAddonPurchase({
        userId,
        addonType: 'platform_access',
        packageSku: pendingOrder.packageSku, // Use stored SKU
        billingType: pkg.billingType,
        status: 'active',
        purchaseAmount: pendingOrder.amount, // Use stored amount
        currency: pendingOrder.currency, // Use stored currency
        startDate,
        endDate,
        totalUnits: 0, // Platform access doesn't have units
        autoRenew: false,
        metadata: {
          gatewayOrderId: gatewayOrderId,
          paymentId: paymentId,
          pendingOrderId: pendingOrder.id,
          gateway: pendingOrder.gatewayProvider,
        },
      });

      // Mark pending order as completed
      await billingStorage.updatePendingOrderStatus(orderId, userId, 'completed', new Date());

      // Update subscription to remove trial limits (grant unlimited access)
      const subscription = await authStorage.getSubscriptionByUserId(userId);
      if (subscription) {
        await authStorage.updateSubscription(subscription.id, {
          status: 'active',
          planType: pkg.billingType, // e.g., 'monthly', '6_months', etc.
          sessionsLimit: null, // Remove session limit (unlimited)
          minutesLimit: null, // Remove minutes limit (unlimited)
        });
        console.log(`✅ Subscription updated for user ${userId}: Unlimited access granted`);
      }

      // Refresh user entitlements
      await billingStorage.refreshUserEntitlements(userId);

      res.json({
        success: true,
        purchase,
        message: "Platform access activated successfully",
      });
    } catch (error: any) {
      console.error("Verify platform access error:", error);
      res.status(500).json({ message: error.message || "Failed to verify purchase" });
    }
  });

  // Get current platform access status
  app.get("/api/billing/platform-access/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const activeSub = await billingStorage.getActiveAddonPurchase(userId, 'platform_access');

      if (!activeSub) {
        return res.json({
          hasAccess: false,
          subscription: null,
        });
      }

      res.json({
        hasAccess: true,
        subscription: activeSub,
      });
    } catch (error) {
      console.error("Get platform access status error:", error);
      res.status(500).json({ message: "Failed to get platform access status" });
    }
  });

  // ========================================
  // USER ENTITLEMENTS
  // ========================================

  // Get user entitlements (cached)
  app.get("/api/billing/entitlements", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      let entitlements = await billingStorage.getUserEntitlements(userId);

      // If no cached entitlements, calculate and cache them
      if (!entitlements) {
        entitlements = await billingStorage.refreshUserEntitlements(userId);
      }

      res.json(entitlements);
    } catch (error) {
      console.error("Get entitlements error:", error);
      res.status(500).json({ message: "Failed to get entitlements" });
    }
  });

  // Refresh user entitlements (force recalculation)
  app.post("/api/billing/entitlements/refresh", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const entitlements = await billingStorage.refreshUserEntitlements(userId);

      res.json(entitlements);
    } catch (error) {
      console.error("Refresh entitlements error:", error);
      res.status(500).json({ message: "Failed to refresh entitlements" });
    }
  });

  // ========================================
  // USER PURCHASE HISTORY
  // ========================================

  // Get user's purchase history
  app.get("/api/billing/purchases", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { addonType } = req.query;

      const purchases = await billingStorage.getUserAddonPurchases(userId, addonType as string);

      res.json({ purchases });
    } catch (error) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Failed to get purchase history" });
    }
  });


  // ========================================
  // SHOPPING CART (Multi-Item Checkout)
  // ========================================

  // Check if item is available for purchase
  app.get("/api/cart/check-availability/:packageSku", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { packageSku } = req.params;

      const pkg = await getPackageOrAddonBySku(packageSku);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const addonType = await getAddonTypeFromSku(packageSku);
      if (!addonType) {
        return res.status(400).json({ message: "Invalid package SKU" });
      }

      const purchaseMode = (req.query.purchaseMode as 'user' | 'team') === 'team' ? 'team' : 'user';
      const availability = await billingStorage.checkItemAvailability(userId, packageSku, addonType, { purchaseMode });

      res.json({
        packageSku,
        packageName: pkg.name,
        available: availability.available,
        reason: availability.reason,
      });
    } catch (error) {
      console.error("Check availability error:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Add item to cart
  app.post("/api/cart/add", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        packageSku: z.string(),
        quantity: z.number().int().positive().default(1),
        purchaseMode: z.enum(['user', 'team']).default('user'),
        teamManagerName: z.string().optional(),
        teamManagerEmail: z.string().email().optional(),
        companyName: z.string().optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { packageSku, quantity, purchaseMode, teamManagerName, teamManagerEmail, companyName } = validation.data;

      // Validate team mode requires manager info and company name
      if (purchaseMode === 'team' && (!teamManagerName || !teamManagerEmail)) {
        return res.status(400).json({ message: "Team mode requires License Manager name and email" });
      }
      
      if (purchaseMode === 'team' && !companyName) {
        return res.status(400).json({ message: "Team mode requires company name" });
      }

      // Get package details
      const pkg = await getPackageOrAddonBySku(packageSku);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const addonType = await getAddonTypeFromSku(packageSku);
      if (!addonType) {
        return res.status(400).json({ message: "Invalid package SKU" });
      }

      // Validate quantity for non-stackable subscriptions (only in user mode)
      // Team mode allows multiple platform access licenses for bulk purchases
      if (addonType === 'platform_access' && quantity > 1 && purchaseMode !== 'team') {
        return res.status(400).json({ message: "Cannot add multiple units of subscription plans. Quantity must be 1." });
      }

      // Check availability (team platform_access is allowed even if user has personal subscription)
      const availability = await billingStorage.checkItemAvailability(userId, packageSku, addonType, { purchaseMode });
      if (!availability.available) {
        return res.status(400).json({ message: availability.reason || "Item not available" });
      }

      // Check if item already exists in cart
      const existingCartItems = await billingStorage.getCartItems(userId);
      const existingItem = existingCartItems.find(item => item.packageSku === packageSku);

      if (existingItem) {
        return res.status(400).json({ message: "Item already in cart" });
      }

      // IMPORTANT: Check for conflicting addon types in cart
      // Only ONE active addon of each type (dai, train_me, platform_access) is allowed per user
      // Prevent adding multiple items of the same addon type to cart
      if (addonType === 'service') {
        // For service type, check if it's DAI or Train Me based on package name
        const packageName = pkg.name.toLowerCase();
        let serviceCategory = 'train_me'; // default
        
        if (packageName.includes('dai')) {
          serviceCategory = 'dai';
        } else if (packageName.includes('train me')) {
          serviceCategory = 'train_me';
        }
        
        // Check if cart already has an item of this service category
        const conflictingItem = existingCartItems.find(item => {
          if (item.addonType !== 'service') return false;
          const itemName = item.packageName.toLowerCase();
          if (serviceCategory === 'dai' && itemName.includes('dai')) return true;
          if (serviceCategory === 'train_me' && itemName.includes('train me')) return true;
          return false;
        });
        
        if (conflictingItem) {
          const categoryName = serviceCategory === 'dai' ? 'Domain AI Intelligence' : 'Train Me';
          return res.status(400).json({ 
            message: `You can only have one ${categoryName} item in your cart at a time. Please remove "${conflictingItem.packageName}" first.`,
            conflictingItem: conflictingItem.packageName
          });
        }
      } else if (addonType === 'platform_access') {
        // Check if cart already has a platform access item (in user mode)
        if (purchaseMode === 'user') {
          const conflictingItem = existingCartItems.find(item => item.addonType === 'platform_access' && item.purchaseMode === 'user');
          if (conflictingItem) {
            return res.status(400).json({ 
              message: `You can only have one Platform Access subscription in your cart at a time. Please remove "${conflictingItem.packageName}" first.`,
              conflictingItem: conflictingItem.packageName
            });
          }
        }
      }

      // Add to cart
      const cartItem = await billingStorage.addToCart({
        userId,
        packageSku,
        addonType,
        packageName: pkg.name,
        basePrice: pkg.price.toString(),
        currency: pkg.currency,
        quantity,
        purchaseMode: purchaseMode,
        teamManagerName: purchaseMode === 'team' ? teamManagerName : undefined,
        teamManagerEmail: purchaseMode === 'team' ? teamManagerEmail : undefined,
        companyName: purchaseMode === 'team' ? companyName : undefined,
        metadata: {
          validityDays: pkg.validityDays,
          totalUnits: pkg.totalUnits,
        },
      });

      res.json({ cartItem, message: "Item added to cart" });
    } catch (error: any) {
      console.error("Add to cart error:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Item already in cart" });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/remove/:cartItemId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { cartItemId } = req.params;

      await billingStorage.removeFromCart(userId, cartItemId);

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Get cart items with total calculation
  app.get("/api/cart", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;

      const cartTotal = await billingStorage.calculateCartTotal(userId);

      res.json(cartTotal);
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ message: "Failed to get cart" });
    }
  });

  // Clear entire cart
  app.delete("/api/cart/clear", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;

      await billingStorage.clearCart(userId);

      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Apply promo code to cart item
  app.post("/api/cart/items/:cartItemId/promo", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { cartItemId } = req.params;
      const validation = z.object({
        promoCode: z.string().min(1, "Promo code is required"),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { promoCode } = validation.data;

      const result = await billingStorage.applyPromoCodeToCartItem(userId, cartItemId, promoCode);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({ message: result.message, cartItem: result.cartItem });
    } catch (error) {
      console.error("Apply promo code error:", error);
      res.status(500).json({ message: "Failed to apply promo code" });
    }
  });

  // Remove promo code from cart item
  app.delete("/api/cart/items/:cartItemId/promo", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { cartItemId } = req.params;

      const result = await billingStorage.removePromoCodeFromCartItem(userId, cartItemId);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({ message: result.message });
    } catch (error) {
      console.error("Remove promo code error:", error);
      res.status(500).json({ message: "Failed to remove promo code" });
    }
  });

  // Multi-item checkout (create single payment order for entire cart)
  app.post("/api/cart/checkout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { paymentGateway: requestedGateway } = validation.data;
      
      // Use requested gateway or fall back to configured default
      const paymentGateway = requestedGateway || DEFAULT_PAYMENT_GATEWAY;
      
      if (paymentGateway === 'stripe') {
        return res.status(400).json({ message: "Stripe is not supported yet" });
      }

      // Get user info for payment gateway customer details
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get cart total (per-item promo codes already applied)
      const cartTotal = await billingStorage.calculateCartTotal(userId);

      if (cartTotal.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // CHECK FOR 100% DISCOUNT - Skip payment gateway if total is 0 or very close to 0
      // Use 0.01 threshold to handle floating point precision issues
      if (cartTotal.total <= 0.01) {
        console.log(`[Cart Checkout] 🎉 100% discount applied! Total: ${cartTotal.total}. Skipping payment gateway.`);
        console.log(`[Cart Checkout] Breakdown - Subtotal: ${cartTotal.subtotal}, Discount: ${cartTotal.discount}, GST: ${cartTotal.gstAmount}`);
        
        // Create a completed order record (no payment needed)
        const pendingOrder = await billingStorage.createPendingOrder({
          userId,
          packageSku: 'CART-MULTI-ITEM',
          addonType: 'cart_checkout',
          amount: '0.00',
          currency: cartTotal.currency,
          gatewayOrderId: `FREE-${Date.now()}`,
          gatewayProvider: 'free_promo',
          status: 'completed', // Mark as completed immediately
          metadata: {
            itemCount: cartTotal.items.length,
            items: cartTotal.items.map(item => ({
              packageSku: item.packageSku,
              packageName: item.packageName,
              addonType: item.addonType,
              basePrice: item.basePrice,
              discount: item.appliedDiscountAmount || '0',  // CRITICAL FIX: Include per-item discount
              currency: item.currency,
              quantity: item.quantity,
              metadata: item.metadata,
              purchaseMode: item.purchaseMode,
              teamManagerName: item.teamManagerName,
              teamManagerEmail: item.teamManagerEmail,
              companyName: item.companyName,
            })),
            subtotal: cartTotal.subtotal,
            gstAmount: 0, // No GST for free items
            discount: cartTotal.discount,
            total: 0,
            roundoffAmount: 0,
            finalAmount: 0,
            originalCurrency: cartTotal.currency,
            finalCurrency: cartTotal.currency,
            freePromo: true, // Flag to indicate this was a free promo
            perItemPromoCodes: cartTotal.items.map(item => ({
              cartItemId: item.id,
              promoCodeId: item.promoCodeId,
              promoCodeCode: item.promoCodeCode,
              appliedDiscountAmount: item.appliedDiscountAmount,
            })),
          },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        console.log(`[Cart Checkout] Created free order: ${pendingOrder.id}`);

        // Create a payment record with status 'succeeded' (amount: 0)
        await authStorage.createPayment({
          userId,
          razorpayOrderId: pendingOrder.gatewayOrderId,
          razorpayPaymentId: `free_${Date.now()}`,
          amount: '0.00',
          currency: cartTotal.currency,
          status: 'succeeded',
          paymentMethod: 'promo_code_100%',
          metadata: {
            type: 'cart_checkout',
            orderId: pendingOrder.id,
            gatewayProvider: 'free_promo',
            freePromo: true,
            itemCount: cartTotal.items.length,
          },
        });

        // Activate personal cart items only (team items are handled below)
        const result = await activateCartCheckout(pendingOrder, `free_${Date.now()}`, undefined, req);

        if (!result.success) {
          console.error(`[Cart Checkout] Failed to activate free items: ${result.message}`);

          const errorMessage = (result.message || '').toLowerCase();

          // Treat "already have an active subscription" style errors as a clean 400,
          // instead of bubbling up as a 500 from the free checkout flow.
          if (
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('unique_active_addon_per_user') ||
            errorMessage.includes('already have an active')
          ) {
            return res.status(400).json({
              message: "You already have an active subscription for one of these items. Please check your active subscriptions in your profile.",
              error: "DUPLICATE_ADDON",
              details: "Only one active subscription per addon type is allowed."
            });
          }

          return res.status(500).json({
            message: "Failed to activate items",
            error: result.message
          });
        }

        // Run team activation when cart has team items (org, license package, org add-ons, invitation)
        const teamResult = await runTeamCartActivation(pendingOrder, userId, req);

        // Clear the cart (activateCartCheckout already cleared it; ensure no-op if called twice)
        await billingStorage.clearCart(userId);

        console.log(`[Cart Checkout] ✅ Free order completed: ${result.activatedAddons.length} personal items activated, team invitation: ${teamResult.licenseManagerInvitationSent}`);

        // Return success response (no payment gateway needed)
        return res.json({
          success: true,
          freeOrder: true,
          orderId: pendingOrder.id,
          message: "Order completed successfully with 100% discount!",
          activatedAddons: result.activatedAddons,
          itemCount: result.activatedAddons.length,
          licenseManagerInvitationSent: teamResult.licenseManagerInvitationSent,
          breakdown: {
            subtotal: cartTotal.subtotal,
            discount: cartTotal.discount,
            total: 0,
            currency: cartTotal.currency,
          },
        });
      }

      // REGULAR PAYMENT FLOW (when total > 0)

      // Real-time currency conversion for Cashfree (only supports INR)
      let finalCurrency = cartTotal.currency;
      let conversionRate = 1;
      let conversionInfo = null;
      let finalAmount = Math.round(cartTotal.total * 100) / 100; // Round to 2 decimal places
      
      if (paymentGateway === 'cashfree' && finalCurrency === 'USD') {
        try {
          const conversion = await currencyConverter.convertCurrency(cartTotal.total, 'USD', 'INR');
          finalAmount = Math.round(conversion.convertedAmount * 100) / 100; // Round to 2 decimal places
          finalCurrency = 'INR';
          conversionRate = conversion.exchangeRate;
          conversionInfo = conversion;
          console.log(`[Cart Cashfree] Converted ${conversion.originalAmount} USD to ${conversion.convertedAmount} INR (rate: ${conversion.exchangeRate})`);
        } catch (error) {
          console.error(`[Cart Cashfree] Currency conversion failed:`, error);
          return res.status(500).json({ 
            message: "Currency conversion failed. Please try again later.",
            error: "CURRENCY_CONVERSION_ERROR"
          });
        }
      }

      // Minimum transaction amount adjustment
      const MINIMUM_USD_AMOUNT = 1.00;
      const MINIMUM_INR_AMOUNT = 1.00;
      let roundoffAmount = 0;
      
      if (finalCurrency === 'USD' && finalAmount < MINIMUM_USD_AMOUNT) {
        roundoffAmount = Math.round((MINIMUM_USD_AMOUNT - finalAmount) * 100) / 100;
        finalAmount = MINIMUM_USD_AMOUNT;
      } else if (finalCurrency === 'INR' && finalAmount < MINIMUM_INR_AMOUNT) {
        roundoffAmount = Math.round((MINIMUM_INR_AMOUNT - finalAmount) * 100) / 100;
        finalAmount = MINIMUM_INR_AMOUNT;
      }

      // Verify all items are still available
      for (const item of cartTotal.items) {
        const purchaseMode = (item.purchaseMode === 'team' ? 'team' : 'user') as 'user' | 'team';
        const availability = await billingStorage.checkItemAvailability(userId, item.packageSku, item.addonType, { purchaseMode });
        if (!availability.available) {
          return res.status(400).json({ 
            message: `Item "${item.packageName}" is no longer available`, 
            reason: availability.reason 
          });
        }
      }

      // Validate team purchase rules if any item has purchaseMode: 'team'
      // Note: purchaseMode, teamManagerName, teamManagerEmail are top-level cart item fields
      const teamItems = cartTotal.items.filter(item => item.purchaseMode === 'team');
      if (teamItems.length > 0) {
        // Get team manager info from first team item
        const teamItem = teamItems[0];
        const teamManagerName = teamItem.teamManagerName;
        const teamManagerEmail = teamItem.teamManagerEmail;
        
        if (!teamManagerName || !teamManagerEmail) {
          return res.status(400).json({ 
            message: "Team purchases require License Manager name and email" 
          });
        }

        // Calculate quantities by type
        const platformAccessQty = cartTotal.items
          .filter(item => item.addonType === 'platform_access')
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const sessionMinutesQty = cartTotal.items
          .filter(item => item.addonType === 'session_minutes')
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const daiQty = cartTotal.items
          .filter(item => item.addonType === 'dai')
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const trainMeQty = cartTotal.items
          .filter(item => item.addonType === 'train_me')
          .reduce((sum, item) => sum + (item.quantity || 1), 0);

        // Team mode rule: Platform Access quantity must equal Session Minutes quantity
        if (platformAccessQty > 0 && sessionMinutesQty > 0 && platformAccessQty !== sessionMinutesQty) {
          return res.status(400).json({ 
            message: `Team purchases require Session Minutes quantity (${sessionMinutesQty}) to equal Platform Access quantity (${platformAccessQty})` 
          });
        }

        // Team mode rule: DAI/Train Me quantities cannot exceed Platform Access count
        if (daiQty > platformAccessQty) {
          return res.status(400).json({ 
            message: `DAI quantity (${daiQty}) cannot exceed Platform Access quantity (${platformAccessQty})` 
          });
        }

        if (trainMeQty > platformAccessQty) {
          return res.status(400).json({ 
            message: `Train Me quantity (${trainMeQty}) cannot exceed Platform Access quantity (${platformAccessQty})` 
          });
        }
      }

      // Create a pending order for the cart total (with roundoff if applicable)
      const pendingOrder = await billingStorage.createPendingOrder({
        userId,
        packageSku: 'CART-MULTI-ITEM', // Special SKU for multi-item orders
        addonType: 'cart_checkout',
        amount: finalAmount.toFixed(2),
        currency: finalCurrency,
        gatewayOrderId: '',
        gatewayProvider: paymentGateway,
        status: 'pending',
        metadata: {
          itemCount: cartTotal.items.length,
          items: cartTotal.items.map(item => ({
            packageSku: item.packageSku,
            packageName: item.packageName,
            addonType: item.addonType,
            basePrice: item.basePrice,
            discount: item.appliedDiscountAmount || '0',  // CRITICAL FIX: Include per-item discount
            currency: item.currency,
            quantity: item.quantity,
            metadata: item.metadata,
            purchaseMode: item.purchaseMode,
            teamManagerName: item.teamManagerName,
            teamManagerEmail: item.teamManagerEmail,
            companyName: item.companyName,
          })),
          subtotal: cartTotal.subtotal,
          gstAmount: cartTotal.gstAmount,
          discount: cartTotal.discount,
          total: cartTotal.total,
          roundoffAmount: roundoffAmount,
          finalAmount: finalAmount,
          originalCurrency: cartTotal.currency,
          finalCurrency: finalCurrency,
          conversionRate: conversionRate !== 1 ? conversionRate : undefined,
          perItemPromoCodes: cartTotal.items.map(item => ({
            cartItemId: item.id,
            promoCodeId: item.promoCodeId,
            promoCodeCode: item.promoCodeCode,
            appliedDiscountAmount: item.appliedDiscountAmount,
          })),
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });

      console.log(`[Cart Checkout] Created pending order: ${pendingOrder.id}, addonType: ${pendingOrder.addonType}, userId: ${userId}`);

      // Create payment gateway order for final amount (with roundoff adjustment if needed)
      const gateway = PaymentGatewayFactory.getGateway(paymentGateway);
      const baseUrl = getBaseUrl(req);
      const returnUrl = `${baseUrl}/payment/success?orderId=${pendingOrder.id}`;
      const notifyUrl = `${baseUrl}/api/billing/webhook`;
      
      // Determine Cashfree mode for logging and client-side matching
      // Match the logic in PaymentGatewayFactory for consistency
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      let isCashfreeSandbox = false;
      if (paymentGateway === 'cashfree') {
        if (process.env.CASHFREE_ENVIRONMENT === 'SANDBOX') {
          isCashfreeSandbox = true;
        } else if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
          isCashfreeSandbox = false;
        } else {
          // Auto-detect: Use SANDBOX for localhost/development
          isCashfreeSandbox = !process.env.APP_URL || 
            process.env.APP_URL.includes('localhost') || 
            process.env.APP_URL.includes('127.0.0.1') ||
            process.env.NODE_ENV === 'development';
        }
      }
      
      // Debug: Log URLs and mode
      console.log(`[Checkout] Base URL: ${baseUrl}`);
      console.log(`[Checkout] Return URL: ${returnUrl}`);
      console.log(`[Checkout] Notify URL: ${notifyUrl}`);
      console.log(`[Checkout] Payment Gateway: ${paymentGateway}`);
      let cashfreeMode: string | undefined;
      if (paymentGateway === 'cashfree') {
        cashfreeMode = isCashfreeSandbox ? 'sandbox' : 'production';
        console.log(`[Checkout] Cashfree Mode: ${cashfreeMode.toUpperCase()}`);
      }
      
      // Validate URLs for Cashfree
      // Production mode requires HTTPS, but sandbox mode may allow HTTP for localhost
      if (paymentGateway === 'cashfree') {
        if (!isCashfreeSandbox && (!returnUrl.startsWith('https://') || !notifyUrl.startsWith('https://'))) {
          throw new Error(`Cashfree PRODUCTION mode requires HTTPS URLs. Return URL: ${returnUrl}, Notify URL: ${notifyUrl}. ` +
            `For localhost development, set CASHFREE_ENVIRONMENT=SANDBOX in .env, or set APP_URL to your public HTTPS URL.`);
        }
      }
      
      // For team purchases, use team manager's details; otherwise use logged-in user's details
      let customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Customer';
      let customerEmail = user.email || 'customer@example.com';
      let customerPhone = user.mobile || '';
      
      if (teamItems.length > 0) {
        const teamItem = teamItems[0];
        customerName = teamItem.teamManagerName || customerName;
        customerEmail = teamItem.teamManagerEmail || customerEmail;
        console.log(`[Team Payment] Using team manager details: ${customerName} (${customerEmail})`);
      }
      
      // Ensure customerEmail is valid (required by payment gateways)
      if (!customerEmail || customerEmail.trim() === '') {
        customerEmail = 'customer@example.com';
        console.warn(`[Payment] No customer email provided, using default: ${customerEmail}`);
      }
      
      const order = await gateway.createOrder({
        amount: finalAmount,
        currency: finalCurrency,
        receipt: `CT-${pendingOrder.id.substring(0, 35)}`,
        metadata: {
          userId,
          pendingOrderId: pendingOrder.id,
          itemCount: cartTotal.items.length,
          checkoutType: 'cart',
          roundoffAmount: roundoffAmount,
          returnUrl: returnUrl,
          notifyUrl: notifyUrl,
        },
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone || '9999999999',
      });

      // Update pending order with gateway order ID
      await billingStorage.updatePendingOrderGatewayId(pendingOrder.id, order.providerOrderId);

      // Log gateway transaction
      const gatewayProvider = await billingStorage.getGatewayProviderByName(gateway.getProviderName());
      if (gatewayProvider) {
        await billingStorage.createGatewayTransaction({
          providerId: gatewayProvider.id,
          providerTransactionId: order.providerOrderId,
          transactionType: 'order',
          status: order.status,
          amount: finalAmount.toFixed(2),
          currency: finalCurrency,
          metadata: {
            checkoutType: 'cart',
            itemCount: cartTotal.items.length,
            roundoffAmount: roundoffAmount,
            originalCurrency: cartTotal.currency,
            conversionRate: conversionRate !== 1 ? conversionRate : undefined,
          },
          userId,
        });
      }

      const responsePayload = {
        orderId: pendingOrder.id, // Use Rev Winner order ID for verification
        paymentSessionId: order.paymentSessionId,
        gatewayOrderId: order.providerOrderId, // Gateway-specific order ID (Cashfree/Razorpay)
        amount: finalAmount,
        currency: finalCurrency,
        gateway: paymentGateway,
        // Razorpay-specific: include key ID for frontend SDK
        keyId: paymentGateway === 'razorpay' ? getRazorpayKeyId() : undefined,
        // Cashfree-specific: include mode so client can match it
        cashfreeMode: cashfreeMode,
        breakdown: {
          subtotal: cartTotal.subtotal,
          gstAmount: cartTotal.gstAmount,
          gstRate: '18%',
          discount: cartTotal.discount,
          roundoffAmount: roundoffAmount,
          total: cartTotal.total,
          finalAmount: finalAmount,
          originalCurrency: cartTotal.currency,
          finalCurrency: finalCurrency,
          conversionRate: conversionRate !== 1 ? conversionRate : undefined,
        },
        items: cartTotal.items,
        gatewayDetails: order,
      };
      
      console.log(`Cart checkout response - amount: ${finalAmount} ${finalCurrency} roundoff: ${roundoffAmount}`);
      console.log(`${paymentGateway} order details:`, order);
      console.log(`[Cart Checkout] Returning orderId: ${pendingOrder.id} for verification`);
      
      // Validate payment session ID exists before sending response
      if (!order.paymentSessionId && paymentGateway === 'cashfree') {
        console.error(`[Checkout] Missing paymentSessionId for Cashfree order:`, order);
        throw new Error("Payment session ID missing from Cashfree order. Check return_url is HTTPS.");
      }
      
      res.json(responsePayload);
    } catch (error: any) {
      console.error("Cart checkout error:", error);
      
      // Provide more specific error messages
      let statusCode = 500;
      let errorMessage = "Failed to create checkout";
      
      if (error.message?.includes("not configured") || error.message?.includes("credentials not provided")) {
        statusCode = 503; // Service Unavailable
        errorMessage = "Payment gateway is not configured. Please contact support or try a different payment method.";
      } else if (error.message?.includes("authentication") || error.message?.includes("Authentication failed")) {
        statusCode = 503;
        errorMessage = "Payment gateway authentication failed. Please contact support.";
      } else if (error.message?.includes("currency")) {
        statusCode = 400;
        errorMessage = error.message; // Use the detailed currency error message
      } else if (error.message?.includes("Cart is empty")) {
        statusCode = 400;
        errorMessage = "Your cart is empty";
      } else if (error.message?.includes("no longer available")) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(statusCode).json({ message: errorMessage });
    }
  });

  // Verify cart checkout payment and activate all items
  app.post("/api/cart/verify", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const validation = z.object({
        orderId: z.string(), // Rev Winner pending order ID
        cfPaymentId: z.string().optional(), // Cashfree payment ID (optional for verification)
        // Razorpay-specific verification fields
        razorpayPaymentId: z.string().optional(),
        razorpaySignature: z.string().optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request", errors: validation.error.errors });
      }

      const { orderId, cfPaymentId, razorpayPaymentId, razorpaySignature } = validation.data;

      console.log(`[Cart Verify] Processing verification for order: ${orderId}, user: ${userId}`);

      // Get pending order using our order ID
      const pendingOrder = await billingStorage.getPendingOrder(orderId);
      if (!pendingOrder) {
        console.error(`[Cart Verify] Order not found: ${orderId}`);
        return res.status(404).json({ message: "Order not found" });
      }

      console.log(`[Cart Verify] Found order: ${orderId}, addonType: ${pendingOrder.addonType}, packageSku: ${pendingOrder.packageSku}`);

      // Security check: Verify user owns this order
      if (pendingOrder.userId !== userId) {
        console.error(`[Cart Verify] Unauthorized access: order userId ${pendingOrder.userId} !== request userId ${userId}`);
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if order already completed
      if (pendingOrder.status === 'completed') {
        console.log(`[Cart Verify] Order already completed: ${orderId}`);
        return res.status(400).json({ message: "Order already completed" });
      }

      // Validate that this is a cart checkout order
      if (pendingOrder.addonType !== 'cart_checkout') {
        console.error(`[Cart Verify] Invalid order type for cart verification: ${pendingOrder.addonType}, expected: cart_checkout`);
        
        // Provide helpful error message based on the actual order type
        if (pendingOrder.addonType === 'session_minutes') {
          return res.status(400).json({ 
            message: "This order should be verified using the session minutes verification endpoint", 
            correctEndpoint: "/api/session-minutes/verify-payment",
            orderType: pendingOrder.addonType,
            orderId: orderId,
            hint: "This appears to be a session minutes order, not a cart checkout order"
          });
        } else if (pendingOrder.addonType === 'train_me') {
          return res.status(400).json({ 
            message: "This order should be verified using the Train Me verification endpoint", 
            correctEndpoint: "/api/train-me/verify-payment",
            orderType: pendingOrder.addonType,
            orderId: orderId,
            hint: "This appears to be a Train Me order, not a cart checkout order"
          });
        } else {
          return res.status(400).json({ 
            message: "Invalid order type for cart verification", 
            expected: "cart_checkout",
            actual: pendingOrder.addonType,
            orderId: orderId
          });
        }
      }

      // Get gateway
      const gateway = PaymentGatewayFactory.getGateway(pendingOrder.gatewayProvider as PaymentGatewayProvider);
      
      const gatewayOrderId = pendingOrder.gatewayOrderId;
      if (!gatewayOrderId) {
        return res.status(400).json({ message: "Gateway order ID not found" });
      }

      console.log(`Verifying ${pendingOrder.gatewayProvider} payment for order: ${gatewayOrderId}`);
      
      let isPaid = false;
      let verifiedPaymentId: string | undefined;
      let paymentStatus: any;

      if (pendingOrder.gatewayProvider === 'razorpay') {
        // Razorpay uses signature-based verification
        if (!razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ message: "Missing Razorpay verification data" });
        }
        
        // Step 1: Verify signature using HMAC - use the Razorpay order ID stored in pendingOrder
        const razorpayOrderId = pendingOrder.gatewayOrderId;
        const signatureValid = gateway.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        console.log(`Razorpay signature verification for order ${razorpayOrderId}: ${signatureValid}`);
        
        if (!signatureValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
        
        // Step 2: Double-check payment status from Razorpay API
        paymentStatus = await gateway.getPaymentStatus(razorpayPaymentId);
        console.log(`Razorpay payment status for ${razorpayPaymentId}:`, paymentStatus.status);
        
        isPaid = paymentStatus.status === 'captured' || paymentStatus.status === 'authorized';
        verifiedPaymentId = razorpayPaymentId;
      } else {
        // Cashfree uses API-based verification
        paymentStatus = await gateway.getPaymentStatus(gatewayOrderId);
        console.log(`${pendingOrder.gatewayProvider} payment status:`, paymentStatus);
        
        isPaid = paymentStatus.status === 'PAID' || 
                 paymentStatus.status === 'SUCCESS' || 
                 paymentStatus.status === 'captured' ||
                 paymentStatus.status === 'authorized';
        verifiedPaymentId = cfPaymentId || paymentStatus.paymentId;
      }
      
      if (!isPaid) {
        // DON'T mark as failed immediately - payment might still be processing
        // Only return error. Order will expire naturally after 30 minutes if not paid.
        console.log(`[Cart Verify] Payment not yet completed. Status: ${paymentStatus.status}`);
        return res.status(400).json({ 
          message: "Payment not yet completed. Please wait and try again.",
          status: paymentStatus.status
        });
      }

      console.log(`[Cart Verify] Payment verified successfully for order ${orderId}, paymentId: ${verifiedPaymentId}`);

      // Get user's organization ID (if they have an active enterprise license)
      const organizationId = await authStorage.getUserOrganizationId(userId);
      
      // Check if payment record already exists (avoid duplicates)
      const existingPayment = await authStorage.getPaymentByRazorpayOrderId(pendingOrder.gatewayOrderId || '');
      
      if (!existingPayment) {
        // Create payment record for this cart checkout
        // Calculate total amount from pending order (amount is stored in dollars/rupees, convert to cents/paise)
        const totalAmount = parseFloat(pendingOrder.amount || '0');
        const amountInCents = Math.round(totalAmount * 100); // Convert to smallest currency unit (cents/paise)
        const currency = pendingOrder.currency || 'USD';
        
        // Extract payment ID from gateway
        let razorpayPaymentId: string | undefined = verifiedPaymentId;
        let razorpayOrderId: string | undefined = pendingOrder.gatewayOrderId;
        
        // Create payment record with amount in cents
        await authStorage.createPayment({
          userId,
          organizationId, // Record customer type at transaction time
          razorpayOrderId,
          razorpayPaymentId,
          amount: amountInCents.toString(), // Store in cents/paise (e.g., 1999 for $19.99)
          currency,
          status: 'succeeded',
          paymentMethod: pendingOrder.gatewayProvider || 'razorpay', // Track payment gateway
          metadata: {
            type: 'cart_checkout',
            orderId: pendingOrder.id,
            gatewayProvider: pendingOrder.gatewayProvider,
            items: (pendingOrder.metadata as any)?.items || [],
            originalAmount: totalAmount, // Keep original amount for reference
          },
        });
        
        console.log(`[Cart Verify] Payment record created for order ${orderId}, amount: ${totalAmount} ${currency} (${amountInCents} ${currency === 'USD' ? 'cents' : 'paise'})`);
      } else {
        // Update existing payment record to succeeded if it was pending
        if (existingPayment.status === 'pending') {
          await authStorage.updatePayment(existingPayment.id, {
            razorpayPaymentId: verifiedPaymentId,
            status: 'succeeded',
          });
          console.log(`[Cart Verify] Payment record updated to succeeded for order ${orderId}`);
        }
      }

      // Create gateway transaction for payment tracking BEFORE activating cart
      console.log(`[Cart Verify] Creating gateway transaction for order: ${orderId}`);
      let gatewayTransactionId: string | undefined;
      
      try {
        const gatewayProvider = await billingStorage.getGatewayProviderByName(pendingOrder.gatewayProvider);
        if (gatewayProvider) {
          const orderMetadata = pendingOrder.metadata as any || {};
          const gatewayTx = await billingStorage.createGatewayTransaction({
            providerId: gatewayProvider.id,
            providerTransactionId: verifiedPaymentId,
            transactionType: 'payment',
            status: 'completed',
            amount: pendingOrder.amount,
            currency: pendingOrder.currency || 'USD',
            userId,
            relatedEntity: 'cart_checkout',
            payload: {
              orderId,
              cartItems: orderMetadata.items || [],
              gatewayProvider: pendingOrder.gatewayProvider,
            },
            metadata: { 
              orderId,
              cartCheckout: true,
              itemCount: (orderMetadata.items || []).length,
            },
          });
          gatewayTransactionId = gatewayTx.id;
          console.log(`[Cart Verify] Gateway transaction created: ${gatewayTransactionId}`);
        }
      } catch (txError) {
        console.error('[Cart Verify] Failed to create gateway transaction:', txError);
        // Continue anyway - addon purchases should still be created
      }
      
      // Use the helper function to activate cart items
      const result = await activateCartCheckout(pendingOrder, verifiedPaymentId, gatewayTransactionId, req);
      
      if (!result.success) {
        return res.status(500).json({ message: result.message || "Failed to activate cart items" });
      }

      const activatedAddons = result.activatedAddons;

      // Handle team purchases (org, license package, org add-ons, invitation)
      const teamResult = await runTeamCartActivation(pendingOrder, userId, req);
      const licenseManagerInvitationSent = teamResult.licenseManagerInvitationSent;

      res.json({
        success: true,
        message: "Cart checkout completed successfully",
        activatedAddons,
        itemCount: activatedAddons.length,
        licenseManagerInvitationSent,
      });
    } catch (error: any) {
      console.error("Verify cart checkout error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        orderId: req.body?.orderId,
        userId: req.jwtUser?.userId
      });
      res.status(500).json({ 
        message: "Failed to verify payment", 
        error: error.message,
        orderId: req.body?.orderId
      });
    }
  });

  // ========================================
  // INVOICE / RECEIPT
  // ========================================

  // Get invoice/receipt for a completed order
  // Get invoice/receipt for a completed order with enhanced formatting
  app.get("/api/billing/invoice", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      const { orderId } = req.query;

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ message: "Order ID is required" });
      }

      // Try to fetch pending order first
      let pendingOrder = await billingStorage.getPendingOrderById(orderId, userId);
      
      // If no pending order found, check if this is an enterprise purchase
      // Enterprise purchases use a different order ID format (ent_xxx)
      if (!pendingOrder && orderId.startsWith('ent_')) {
        console.log(`[Invoice Debug] Enterprise order detected: ${orderId}, looking in payments table`);
        
        // For enterprise purchases, look directly in payments table
        const payment = await authStorage.getPaymentByRazorpayOrderId(orderId);
        
        if (!payment || payment.userId !== userId) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        if (payment.status !== 'success') {
          return res.status(400).json({ message: "Order is not completed yet" });
        }
        
        // Parse metadata to get enterprise purchase details
        const metadata = typeof payment.metadata === 'string'
          ? JSON.parse(payment.metadata)
          : (payment.metadata || {});
        
        // Build invoice data for enterprise purchase
        const invoiceData = {
          orderId: orderId,
          userId: userId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod || 'Cashfree',
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          createdAt: payment.createdAt,
          items: [{
            name: `Enterprise License - ${metadata.totalSeats} seats (${metadata.packageType})`,
            description: `Company: ${metadata.companyName}`,
            quantity: metadata.totalSeats || 1,
            unitPrice: metadata.pricePerSeat || 0,
            amount: payment.amount
          }],
          customer: {
            name: metadata.companyName || 'Enterprise Customer',
            email: metadata.billingEmail || '',
          },
          type: 'enterprise_license'
        };
        
        return res.json(invoiceData);
      }
      
      if (!pendingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow viewing completed orders
      if (pendingOrder.status !== 'completed') {
        return res.status(400).json({ message: "Order is not completed yet" });
      }

      // Fetch all addon purchases for this cart order
      const allPurchases = await billingStorage.getUserAddonPurchases(userId);
      console.log(`[Invoice Debug] Found ${allPurchases.length} total purchases for user ${userId}`);
      
      // Try multiple ways to find order purchases
      let orderPurchases = allPurchases.filter(
        (purchase: any) => purchase.metadata && (purchase.metadata as any).cartOrderId === orderId
      );
      
      // If no purchases found with cartOrderId, try other methods
      if (orderPurchases.length === 0) {
        console.log(`[Invoice Debug] No purchases found with cartOrderId ${orderId}, trying other methods...`);
        
        // Try finding by pendingOrderId (for session minutes and other direct purchases)
        orderPurchases = allPurchases.filter(
          (purchase: any) => purchase.metadata && (purchase.metadata as any).pendingOrderId === orderId
        );
        
        // Try finding by orderId directly
        if (orderPurchases.length === 0) {
          orderPurchases = allPurchases.filter(
            (purchase: any) => purchase.orderId === orderId
          );
        }
        
        // If still no purchases, try finding by gateway order ID
        if (orderPurchases.length === 0 && pendingOrder.gatewayOrderId) {
          orderPurchases = allPurchases.filter(
            (purchase: any) => purchase.metadata && (purchase.metadata as any).gatewayOrderId === pendingOrder.gatewayOrderId
          );
        }
        
        // If still no purchases, try finding recent purchases for this user
        if (orderPurchases.length === 0) {
          const orderDate = pendingOrder.createdAt || new Date();
          const timeDiff = 10 * 60 * 1000; // 10 minutes
          orderPurchases = allPurchases.filter(
            (purchase: any) => {
              const purchaseDate = new Date(purchase.createdAt || purchase.purchaseDate);
              return Math.abs(purchaseDate.getTime() - orderDate.getTime()) < timeDiff;
            }
          );
          console.log(`[Invoice Debug] Found ${orderPurchases.length} purchases within 10 minutes of order time`);
        }
      }
      
      console.log(`[Invoice Debug] Final orderPurchases count: ${orderPurchases.length}`);
      if (orderPurchases.length > 0) {
        console.log(`[Invoice Debug] Sample purchase:`, JSON.stringify(orderPurchases[0], null, 2));
      }

      // Get user info
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // CRITICAL FIX: Get discount information from pending order metadata
      const orderMetadata = pendingOrder.metadata as any || {};
      const cartDiscount = parseFloat(orderMetadata.discount?.toString() || '0');
      const cartSubtotal = parseFloat(orderMetadata.subtotal?.toString() || '0');
      const cartGstAmount = parseFloat(orderMetadata.gstAmount?.toString() || '0');
      const cartTotal = parseFloat(orderMetadata.total?.toString() || '0');
      
      console.log(`[Invoice Debug] Cart metadata - subtotal: ${cartSubtotal}, discount: ${cartDiscount}, gst: ${cartGstAmount}, total: ${cartTotal}`);

      // CRITICAL: Prefer cart metadata.items so invoice line items match exactly what was purchased
      const cartItems = Array.isArray(orderMetadata.items) && orderMetadata.items.length > 0 ? orderMetadata.items : null;
      let items: any[];

      if (cartItems && cartItems.length > 0) {
        // Build line items from the actual cart at checkout (source of truth for what was bought)
        items = cartItems.map((cartItem: any) => {
          const basePrice = parseFloat(cartItem.basePrice || '0');
          const quantity = Math.max(1, parseInt(String(cartItem.quantity), 10) || 1);
          
          // CRITICAL FIX: Calculate discounted price per item
          const itemDiscount = parseFloat(cartItem.discount || '0');
          const discountedPrice = basePrice - itemDiscount;
          const totalAmount = discountedPrice * quantity;
          
          const currency = cartItem.currency || pendingOrder.currency || 'USD';
          const matchingPurchase = orderPurchases.find((p: any) => p.packageSku === cartItem.packageSku);
          const metaForDesc = { packageName: cartItem.packageName };
          const startDate = matchingPurchase?.startDate || new Date();
          const startIso = matchingPurchase?.startDate?.toISOString() || new Date().toISOString();
          // End date: from purchase, or derive from cart item validityDays so invoice doesn't show N/A
          let endDate: Date | null = matchingPurchase?.endDate ?? null;
          if (!endDate) {
            const validityDays = cartItem.metadata?.validityDays != null
              ? parseInt(String(cartItem.metadata.validityDays), 10)
              : (cartItem.addonType === 'usage_bundle' ? 30 : null); // session minutes default 30 days
            if (validityDays != null && !isNaN(validityDays) && validityDays > 0) {
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + validityDays);
            }
          }
          return {
            packageSku: cartItem.packageSku,
            packageName: cartItem.packageName || cartItem.packageSku,
            addonType: cartItem.addonType || 'cart_checkout',
            quantity,
            unitPrice: discountedPrice.toFixed(2),  // CRITICAL FIX: Show discounted price
            basePrice: basePrice.toFixed(2),  // Keep original price for reference
            discount: itemDiscount.toFixed(2),  // CRITICAL FIX: Show discount per item
            totalAmount: totalAmount.toFixed(2),  // CRITICAL FIX: Total after discount
            gstRate: 0,
            gstAmount: '0.00',
            totalWithGst: totalAmount.toFixed(2),
            currency,
            startDate: startIso,
            endDate: endDate ? endDate.toISOString() : null,
            description: getItemDescription(cartItem.addonType || '', metaForDesc),
          };
        });
        console.log(`[Invoice Debug] Built ${items.length} line items from cart metadata (matches purchase)`);
      } else if (orderPurchases.length > 0) {
        // Fallback: build from addon purchases (legacy or when cart metadata missing)
        items = orderPurchases.map((purchase: any) => {
          const metadata = purchase.metadata as any || {};
          const totalWithGst = parseFloat(purchase.purchaseAmount || '0');
          const currency = purchase.currency || 'USD';
          const actualPaidAmount = metadata.actualPaidAmount ? parseFloat(metadata.actualPaidAmount) : totalWithGst;
          const actualCurrency = metadata.actualCurrency || currency;
          const quantity = metadata.quantity || 1;
          const unitPrice = actualPaidAmount / quantity;
          const displayName = metadata.packageName || purchase.packageSku;
          return {
            packageSku: purchase.packageSku,
            packageName: displayName,
            addonType: purchase.addonType,
            quantity,
            unitPrice: unitPrice.toFixed(2),
            basePrice: unitPrice.toFixed(2),
            totalAmount: actualPaidAmount.toFixed(2),
            gstRate: 0,
            gstAmount: '0.00',
            totalWithGst: actualPaidAmount.toFixed(2),
            currency: actualCurrency,
            startDate: purchase.startDate?.toISOString() || new Date().toISOString(),
            endDate: purchase.endDate ? purchase.endDate.toISOString() : null,
            description: getItemDescription(purchase.addonType, metadata),
          };
        });
      } else {
        items = [
        // Fallback item from pending order - use metadata breakdown if available
        (() => {
          const metadata = pendingOrder.metadata as any || {};
          const totalAmount = parseFloat(pendingOrder.amount || '0');
          const currency = pendingOrder.currency || 'USD';
          
          // Check if we have cart metadata with proper GST breakdown
          if (metadata.subtotal !== undefined && metadata.gstAmount !== undefined) {
            // Use the proper breakdown from cart calculation
            const subtotal = parseFloat(metadata.subtotal?.toString() || '0');
            const gstAmount = parseFloat(metadata.gstAmount?.toString() || '0');
            const gstRate = 0; // No GST for USD
            
            return {
              packageSku: pendingOrder.packageSku || 'CART-MULTI-ITEM',
              packageName: `${metadata.itemCount || 1} Item${(metadata.itemCount || 1) > 1 ? 's' : ''} - Cart Purchase`,
              addonType: pendingOrder.addonType || 'cart_checkout',
              quantity: 1,
              unitPrice: subtotal.toFixed(2),
              basePrice: subtotal.toFixed(2),
              totalAmount: subtotal.toFixed(2), // Subtotal without GST
              gstRate: gstRate,
              gstAmount: gstAmount.toFixed(2),
              totalWithGst: totalAmount.toFixed(2),
              currency: currency,
              startDate: new Date().toISOString(),
              endDate: null,
              description: `Cart Purchase - ${metadata.itemCount || 1} item${(metadata.itemCount || 1) > 1 ? 's' : ''} purchased successfully`,
            };
          } else {
            // Fallback calculation for orders without proper metadata
            let baseAmount: number;
            let gstAmount: number;
            let gstRate: number;
            
            // For USD (Razorpay), no GST
            gstRate = 0;
            baseAmount = totalAmount;
            gstAmount = 0;
            
            return {
              packageSku: pendingOrder.packageSku || 'PENDING-ORDER',
              packageName: 'Order Processing',
              addonType: pendingOrder.addonType || 'cart_checkout',
              quantity: 1,
              unitPrice: baseAmount.toFixed(2),
              basePrice: baseAmount.toFixed(2),
              totalAmount: baseAmount.toFixed(2),
              gstRate: gstRate,
              gstAmount: gstAmount.toFixed(2),
              totalWithGst: totalAmount.toFixed(2),
              currency: currency,
              startDate: new Date().toISOString(),
              endDate: null,
              description: `Order ${orderId} - Payment processed successfully`,
            };
          }
        })()
        ];
      }

      // CRITICAL FIX: Calculate totals using cart metadata if available (includes discount)
      let subtotal: number;
      let totalGst: number;
      let grandTotal: number;
      let discount: number;
      const currency = items[0]?.currency || pendingOrder.currency || 'USD';
      
      if (cartSubtotal > 0 && cartGstAmount >= 0 && cartTotal > 0) {
        // Use cart metadata which has the correct breakdown including discount
        subtotal = cartSubtotal;
        discount = cartDiscount;
        totalGst = cartGstAmount;
        grandTotal = cartTotal; // This already includes discount calculation from cart
        console.log(`[Invoice Debug] Using cart metadata - subtotal: ${subtotal}, discount: ${discount}, gst: ${totalGst}, total: ${grandTotal}`);
      } else {
        // Fallback: Calculate from items (may not include discount)
        subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount), 0);
        totalGst = items.reduce((sum: number, item: any) => sum + parseFloat(item.gstAmount), 0);
        discount = 0;
        // CRITICAL FIX: Apply discount to total calculation
        grandTotal = (subtotal - discount) + totalGst;
        console.log(`[Invoice Debug] Using item calculation - subtotal: ${subtotal}, discount: ${discount}, gst: ${totalGst}, total: ${grandTotal}`);
      }

      console.log(`[Invoice Debug] Calculated totals - subtotal: ${subtotal}, discount: ${discount}, gst: ${totalGst}, total: ${grandTotal}, currency: ${currency}`);

      const invoiceBranding = await getInvoiceConfig();
      const invoiceData = {
        // Invoice Header
        invoiceNumber: `INV-${orderId.slice(-8).toUpperCase()}`,
        orderId: pendingOrder.gatewayOrderId || orderId,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(), // Immediate payment
        
        // Company and terms from system_config (no hardcoded branding)
        company: invoiceBranding.company,
        
        // Customer Information
        customer: {
          id: userId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          email: user.email,
          mobile: user.mobile || null,
          organization: user.organization || null,
        },
        
        // Payment Information
        payment: {
          method: pendingOrder.gatewayProvider === 'cashfree' ? 'Cashfree' : 
                  pendingOrder.gatewayProvider === 'razorpay' ? 'Razorpay' : 
                  pendingOrder.gatewayProvider || 'Online Payment',
          status: 'COMPLETED',
          transactionId: pendingOrder.gatewayOrderId,
          paymentDate: pendingOrder.createdAt?.toISOString() || new Date().toISOString(),
        },
        
        // Line Items
        items,
        
        // Financial Summary (FIXED: Now includes discount)
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)), // CRITICAL FIX: Include discount
          subtotalAfterDiscount: parseFloat((subtotal - discount).toFixed(2)), // CRITICAL FIX: Show discounted subtotal
          gst: parseFloat(totalGst.toFixed(2)),
          gstRate: 0, // No GST for USD
          total: parseFloat(grandTotal.toFixed(2)),
          currency: currency,
          amountInWords: convertAmountToWords(grandTotal, currency),
        },
        
        // Metadata
        createdAt: pendingOrder.createdAt?.toISOString() || new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        
        terms: invoiceBranding.terms.length > 0
          ? invoiceBranding.terms
          : [
              "This is a computer-generated invoice and does not require a signature.",
              "Payment has been processed successfully via secure payment gateway.",
              "This invoice serves as your receipt for tax and accounting purposes.",
            ],
      };

      res.json(invoiceData);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  // Helper function to get item description
  function getItemDescription(addonType: string, metadata: any): string {
    // CRITICAL FIX: Always use packageName from metadata if available
    // The addonType might be mapped (e.g., 'service' -> 'train_me') but packageName is the actual product
    const packageName = metadata.packageName || '';
    
    // If we have a package name, use it as the primary source of truth
    if (packageName) {
      // Determine the description based on the actual package name
      const nameLower = packageName.toLowerCase();
      
      if (nameLower.includes('session') || nameLower.includes('minute')) {
        return `${packageName}. Provides AI-powered conversation analysis and real-time sales insights.`;
      } else if (nameLower.includes('train')) {
        return `${packageName}. Personalized AI coaching and sales skill development.`;
      } else if (nameLower.includes('dai') || nameLower.includes('domain')) {
        return `${packageName}. Domain-specific AI intelligence and industry insights.`;
      } else if (nameLower.includes('platform') || nameLower.includes('access')) {
        return `${packageName}. Complete access to the sales intelligence platform.`;
      } else if (nameLower.includes('enterprise')) {
        return `${packageName} - ${metadata.seats || 1} seats. Full platform access with team management and advanced analytics.`;
      } else {
        // Generic description for any other package
        return `${packageName}. Professional sales assistance features.`;
      }
    }
    
    // Fallback to addonType-based descriptions if no packageName
    switch (addonType) {
      case 'session_minutes':
        return `Session Minutes Package - Standard Package. Provides AI-powered conversation analysis and real-time sales insights.`;
      case 'train_me':
        return 'Train Me Add-on - 30 Days Access to AI Training Features. Personalized AI coaching and sales skill development.';
      case 'enterprise_license':
        return `Enterprise License - ${metadata.seats || 1} seats. Full platform access with team management and advanced analytics.`;
      case 'platform_access':
        return `Platform Access - Standard Access. Complete access to the sales intelligence platform.`;
      case 'cart_checkout':
        return `Cart Purchase - Multiple Items. Bundle purchase with multiple platform features.`;
      default:
        return `${addonType.replace('_', ' ').toUpperCase()} - Professional sales assistance features`;
    }
  }

  // Helper function to convert amount to words (enhanced implementation)
  function convertAmountToWords(amount: number, currency: string): string {
    const currencyName = currency === 'INR' ? 'Rupees' : 'Dollars';
    const subCurrencyName = currency === 'INR' ? 'Paise' : 'Cents';
    let wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);
    
    // Basic number to words conversion for common amounts
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertHundreds(num: number): string {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }
    
    if (wholePart === 0) {
      return `Zero ${currencyName} Only`;
    }
    
    let result = '';
    
    if (wholePart >= 10000000) { // 1 crore and above
      result += convertHundreds(Math.floor(wholePart / 10000000)) + 'Crore ';
      wholePart %= 10000000;
    }
    
    if (wholePart >= 100000) { // 1 lakh and above
      result += convertHundreds(Math.floor(wholePart / 100000)) + 'Lakh ';
      wholePart %= 100000;
    }
    
    if (wholePart >= 1000) {
      result += convertHundreds(Math.floor(wholePart / 1000)) + 'Thousand ';
      wholePart %= 1000;
    }
    
    if (wholePart > 0) {
      result += convertHundreds(wholePart);
    }
    
    result += currencyName;
    
    if (decimalPart > 0) {
      result += ` and ${convertHundreds(decimalPart)}${subCurrencyName}`;
    }
    
    return result.trim() + ' Only';
  }

  // ========================================
  // CASHFREE WEBHOOKS
  // ========================================

  // Cashfree webhook handler (NO AUTH - Cashfree calls this)
  // Use raw body middleware for signature verification
  app.post("/api/billing/cashfree-webhook", captureRawBody, async (req: Request, res: Response) => {
    try {
      const crypto = await import("crypto");
      const { 
        activateIndividualSubscription,
        activateEnterpriseLicense 
      } = await import("./services/subscription-lifecycle");

      // Verify webhook signature using HMAC-SHA256
      const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("❌ CASHFREE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ message: "Webhook secret not configured" });
      }

      const signature = req.headers["x-webhook-signature"] as string;
      const timestamp = req.headers["x-webhook-timestamp"] as string;
      
      // CRITICAL: Use raw body for signature verification (not parsed JSON)
      const rawBody = req.rawBody || JSON.stringify(req.body);

      // Cashfree signature format: timestamp + rawBody
      const signatureData = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(signatureData)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.error("❌ Invalid Cashfree webhook signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const eventType = req.body.type;
      const data = req.body.data;

      console.log(`📨 Cashfree webhook received: ${eventType}`);

      // Handle PAYMENT_SUCCESS event
      if (eventType === "PAYMENT_SUCCESS" || eventType === "PAYMENT_CAPTURED") {
        const order = data.order;
        const payment = data.payment;
        const orderId = order.order_id;
        const paymentId = payment.cf_payment_id;
        const amount = parseFloat(order.order_amount);
        const currency = order.order_currency;

        console.log(` Payment success: ${paymentId} for order ${orderId}, amount: ${amount} ${currency}`);

        // Find pending order by gateway order ID
        const pendingOrder = await billingStorage.getPendingOrder(orderId);
        
        if (!pendingOrder) {
          console.error(`❌ Pending order not found for gateway order: ${orderId}`);
          return res.status(404).json({ message: "Pending order not found" });
        }

        if (pendingOrder.status !== "pending") {
          console.log(`⚠️ Order ${orderId} already processed (status: ${pendingOrder.status})`);
          return res.json({ status: "acknowledged", message: "Already processed" });
        }

        // Check if this is a cart checkout order
        const isCartCheckout = pendingOrder.addonType === 'cart_checkout' || 
                               pendingOrder.packageSku === 'CART-MULTI-ITEM';

        if (isCartCheckout) {
          // Handle cart checkout activation
          console.log(`🛒 Processing cart checkout order: ${orderId}`);
          const result = await activateCartCheckout(pendingOrder, paymentId, undefined, req);
          
          if (result.success) {
            console.log(`Cart checkout activated: ${result.activatedAddons.length} items`);
            return res.json({ status: "success", message: "Cart checkout processed", itemCount: result.activatedAddons.length });
          } else {
            console.error(`❌ Failed to activate cart checkout: ${result.message}`);
            return res.status(500).json({ status: "error", message: result.message || "Failed to process cart checkout" });
          }
        }

        // Determine if this is individual subscription or enterprise license
        const isEnterprise = pendingOrder.packageSku.includes("enterprise") || 
                            pendingOrder.addonType.includes("enterprise");

        if (isEnterprise) {
          // Handle enterprise license activation
          const metadata = pendingOrder.metadata as any;
          const organizationId = metadata.organizationId;
          const totalSeats = metadata.totalSeats || 1;
          const packageType = metadata.packageType || "1-year-enterprise";

          const result = await activateEnterpriseLicense(
            organizationId,
            packageType,
            totalSeats,
            {
              cashfreeOrderId: orderId,
              cashfreePaymentId: paymentId,
              amount,
              currency,
            },
            pendingOrder.userId
          );

          if (result.success) {
            console.log(`Enterprise license activated: ${result.licensePackageId}`);
          } else {
            console.error(`❌ Failed to activate enterprise license: ${result.message}`);
          }
        } else {
          // Handle individual subscription activation
          const metadata = pendingOrder.metadata as any;
          const planId = metadata.planId || pendingOrder.packageSku;

          const result = await activateIndividualSubscription(
            pendingOrder.userId,
            planId,
            {
              cashfreeOrderId: orderId,
              cashfreePaymentId: paymentId,
              amount,
              currency,
            }
          );

          if (result.success) {
            console.log(`Individual subscription activated: ${result.subscriptionId}`);
          } else {
            console.error(`❌ Failed to activate subscription: ${result.message}`);
          }
        }

        return res.json({ status: "success", message: "Payment processed" });
      }

      // Handle PAYMENT_FAILED event
      if (eventType === "PAYMENT_FAILED" || eventType === "PAYMENT_USER_DROPPED") {
        const order = data.order;
        const payment = data.payment;
        const orderId = order.order_id;
        const paymentId = payment?.cf_payment_id || "unknown";

        console.log(`❌ Payment failed: ${paymentId} for order ${orderId}`);

        // Update pending order status
        const pendingOrder = await billingStorage.getPendingOrder(orderId);
        if (pendingOrder) {
          await billingStorage.updatePendingOrderStatus(orderId, pendingOrder.userId, "failed");
        }

        return res.json({ status: "acknowledged", message: "Payment failure recorded" });
      }

      // Acknowledge other events
      console.log(`ℹ️ Webhook event ${eventType} acknowledged but not processed`);
      res.json({ status: "acknowledged" });

    } catch (error: any) {
      console.error("❌ Cashfree webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing failed", error: error.message });
    }
  });

  // ========================================
  // REFUND MANAGEMENT
  // ========================================

  // Get refund environment info
  app.get("/api/refunds/environment", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { refundService } = await import("./services/refund-service");
      const envInfo = refundService.getEnvironmentInfo();
      
      res.json({
        ...envInfo,
        message: envInfo.isProduction 
          ? "⚠️ PRODUCTION MODE - Real refunds will be processed" 
          : "TEST MODE - Test refunds will be processed"
      });
    } catch (error: any) {
      console.error("Get refund environment error:", error);
      res.status(500).json({ message: "Failed to get environment info", error: error.message });
    }
  });

  // Process refund for a payment (Admin only)
  app.post("/api/refunds/process", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Check if user is admin
      const user = await authStorage.getUserById(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validation = z.object({
        paymentId: z.string(),
        amount: z.number().positive().optional(),
        reason: z.string().min(1),
        notes: z.record(z.string()).optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validation.error.errors 
        });
      }

      const { paymentId, amount, reason, notes } = validation.data;

      // Process refund
      const { refundService } = await import("./services/refund-service");
      const result = await refundService.processRefund({
        paymentId,
        amount,
        reason,
        refundedBy: userId,
        notes,
      });

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          refundId: result.refundId,
          gatewayRefundId: result.gatewayRefundId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          isTestMode: result.isTestMode,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          isTestMode: result.isTestMode,
        });
      }
    } catch (error: any) {
      console.error("Process refund error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process refund", 
        error: error.message 
      });
    }
  });

  // Process refund for an addon purchase (Admin only)
  app.post("/api/refunds/addon", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Check if user is admin
      const user = await authStorage.getUserById(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validation = z.object({
        addonPurchaseId: z.string(),
        paymentId: z.string().optional(), // Optional: specify which payment to refund from purchase history
        amount: z.number().positive().optional(),
        reason: z.string().min(1),
        notes: z.record(z.string()).optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validation.error.errors 
        });
      }

      const { addonPurchaseId, paymentId, amount, reason, notes } = validation.data;

      // Process addon refund
      const { refundService } = await import("./services/refund-service");
      const result = await refundService.processAddonRefund({
        addonPurchaseId,
        ...(paymentId && { paymentId }),
        amount, 
        reason,
        refundedBy: userId,
        notes,
      });

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          refundId: result.refundId,
          gatewayRefundId: result.gatewayRefundId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          isTestMode: result.isTestMode,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          metadata: result.metadata, // Include available payments if applicable
          isTestMode: result.isTestMode,
        });
      }
    } catch (error: any) {
      console.error("Process addon refund error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process addon refund", 
        error: error.message 
      });
    }
  });

  // Get user refunds
  app.get("/api/refunds/user/:userId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const requestingUserId = req.jwtUser!.userId;
      const targetUserId = req.params.userId;

      // Check if user is admin or requesting their own refunds
      const user = await authStorage.getUserById(requestingUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== 'admin' && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const refunds = await authStorage.getRefundsByUserId(targetUserId);
      
      res.json({
        refunds,
        count: refunds.length,
      });
    } catch (error: any) {
      console.error("Get user refunds error:", error);
      res.status(500).json({ 
        message: "Failed to get refunds", 
        error: error.message 
      });
    }
  });

  // Test refund endpoint (for testing in dev environment)
  app.post("/api/refunds/test", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Check if user is admin
      const user = await authStorage.getUserById(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get environment info
      const { refundService } = await import("./services/refund-service");
      const envInfo = refundService.getEnvironmentInfo();

      // Only allow in test mode
      if (envInfo.isProduction) {
        return res.status(403).json({ 
          message: "Test refund endpoint is only available in DEV environment",
          currentEnvironment: envInfo.environment,
        });
      }

      const validation = z.object({
        paymentId: z.string(),
        amount: z.number().positive().optional(),
        reason: z.string().default("Test refund"),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validation.error.errors 
        });
      }

      const { paymentId, amount, reason } = validation.data;

      // Process test refund
      const result = await refundService.processRefund({
        paymentId,
        amount,
        reason: `[TEST] ${reason}`,
        refundedBy: userId,
        notes: { test: "true", environment: envInfo.environment },
      });

      res.json({
        ...result,
        environment: envInfo,
        note: "This is a test refund in DEV environment",
      });
    } catch (error: any) {
      console.error("Test refund error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process test refund", 
        error: error.message 
      });
    }
  });
}
