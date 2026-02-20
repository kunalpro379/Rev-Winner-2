import { db } from "./db";
import {
  gatewayProviders,
  gatewayTransactions,
  gatewayWebhooks,
  addonPurchases,
  sessionMinutesUsage,
  daiUsageLogs,
  enterpriseUserAssignments,
  activationInvites,
  adminActionsLog,
  userEntitlements,
  pendingOrders,
  cartItems,
  promoCodes,
  authUsers,
  organizations,
  addons,
  subscriptionPlans,
  type GatewayProvider,
  type GatewayTransaction,
  type GatewayWebhook,
  type AddonPurchase,
  type SessionMinutesUsage,
  type DaiUsageLog,
  type EnterpriseUserAssignment,
  type ActivationInvite,
  type AdminActionLog,
  type UserEntitlement,
  type PendingOrder,
  type CartItem,
  type Addon,
  type SubscriptionPlan,
  type InsertGatewayProvider,
  type InsertGatewayTransaction,
  type InsertAddonPurchase,
  type InsertSessionMinutesUsage,
  type InsertDaiUsageLog,
  type InsertEnterpriseUserAssignment,
  type InsertActivationInvite,
  type InsertAdminActionLog,
  type InsertUserEntitlement,
  type InsertPendingOrder,
  type InsertCartItem,
} from "../shared/schema";
import { eq, and, gte, desc, sql, lte, or, isNull } from "drizzle-orm";

export interface IBillingStorage {
  // Gateway Provider Management
  createGatewayProvider(data: InsertGatewayProvider): Promise<GatewayProvider>;
  getDefaultGatewayProvider(): Promise<GatewayProvider | null>;
  getGatewayProviderByName(name: string): Promise<GatewayProvider | null>;
  
  // Gateway Transaction Management
  createGatewayTransaction(data: InsertGatewayTransaction): Promise<GatewayTransaction>;
  getGatewayTransaction(id: string): Promise<GatewayTransaction | null>;
  getGatewayTransactionsByUser(userId: string, limit?: number): Promise<GatewayTransaction[]>;
  updateGatewayTransactionStatus(id: string, status: string): Promise<GatewayTransaction>;
  
  // Gateway Webhook Management
  createGatewayWebhook(data: Omit<InsertGatewayTransaction, 'providerId'> & { providerId: string, eventType: string, payload: any, signature?: string }): Promise<GatewayWebhook>;
  markWebhookProcessed(id: string, success: boolean, errorMessage?: string): Promise<void>;
  
  // Pending Orders Management (for secure payment verification)
  createPendingOrder(data: InsertPendingOrder): Promise<PendingOrder>;
  getPendingOrder(gatewayOrderId: string): Promise<PendingOrder | null>;
  getPendingOrderById(orderId: string, userId: string): Promise<PendingOrder | null>;
  updatePendingOrderGatewayId(pendingOrderId: string, gatewayOrderId: string): Promise<PendingOrder>;
  updatePendingOrderStatus(gatewayOrderId: string, userId: string, newStatus: 'completed' | 'failed' | 'expired', completedAt?: Date): Promise<PendingOrder>;
  expirePendingOrders(): Promise<number>;
  
  // Addon Purchase Management
  createAddonPurchase(data: InsertAddonPurchase): Promise<AddonPurchase>;
  getAddonPurchase(id: string): Promise<AddonPurchase | null>;
  getActiveAddonPurchase(userId: string, addonType: string): Promise<AddonPurchase | null>;
  getUserAddonPurchases(userId: string, addonType?: string): Promise<AddonPurchase[]>;
  updateAddonPurchaseStatus(id: string, status: string): Promise<AddonPurchase>;
  updateAddonPurchaseUsage(id: string, usedUnits: number): Promise<AddonPurchase>;
  updateAddonPurchaseRefund(id: string, data: {
    refundedAt: Date;
    refundAmount: string;
    refundReason: string;
    gatewayRefundId: string;
    refundedBy: string;
    status: string;
  }): Promise<AddonPurchase>;
  expireAddonPurchases(): Promise<number>; // Returns count of expired purchases
  
  // Session Minutes Management (with transactional safety)
  trackSessionMinutesUsage(data: InsertSessionMinutesUsage): Promise<SessionMinutesUsage>;
  trackSessionMinutesUsageTransactional(userId: string, sessionId: string, minutesUsed: number): Promise<SessionMinutesUsage>;
  getSessionMinutesBalance(userId: string): Promise<{ totalMinutes: number; usedMinutes: number; remainingMinutes: number; expiresAt: Date | null }>;
  getUserSessionMinutesUsage(userId: string, limit?: number): Promise<SessionMinutesUsage[]>;
  
  // DAI (Rev Winner AI) Management (with transactional safety)
  trackDaiUsage(data: InsertDaiUsageLog): Promise<DaiUsageLog>;
  trackDaiUsageTransactional(userId: string, feature: string, tokensUsed: number, metadata?: any): Promise<DaiUsageLog>;
  getDaiTokenBalance(userId: string): Promise<{ totalTokens: number; usedTokens: number; remainingTokens: number; expiresAt: Date | null }>;
  getUserDaiUsage(userId: string, limit?: number): Promise<DaiUsageLog[]>;
  
  // Enterprise User Assignment Management
  createEnterpriseUserAssignment(data: InsertEnterpriseUserAssignment): Promise<EnterpriseUserAssignment>;
  getEnterpriseUserAssignment(id: string): Promise<EnterpriseUserAssignment | null>;
  getEnterpriseAssignmentsByOrg(organizationId: string): Promise<EnterpriseUserAssignment[]>;
  getEnterpriseAssignmentByUser(userId: string): Promise<EnterpriseUserAssignment | null>;
  updateEnterpriseAssignmentStatus(id: string, status: string): Promise<EnterpriseUserAssignment>;
  revokeEnterpriseAssignment(id: string, revokedBy: string): Promise<EnterpriseUserAssignment>;
  activateEnterpriseUser(token: string, userId: string): Promise<EnterpriseUserAssignment>;
  
  // Activation Invite Management
  createActivationInvite(data: InsertActivationInvite): Promise<ActivationInvite>;
  getActivationInviteByToken(token: string): Promise<ActivationInvite | null>;
  updateActivationInviteStatus(id: string, status: string): Promise<ActivationInvite>;
  
  // Admin Action Logging
  logAdminAction(data: InsertAdminActionLog): Promise<AdminActionLog>;
  getAdminActions(adminId?: string, limit?: number): Promise<AdminActionLog[]>;
  
  // User Entitlements Cache
  refreshUserEntitlements(userId: string): Promise<UserEntitlement>;
  getUserEntitlements(userId: string): Promise<UserEntitlement | null>;
  calculateUserEntitlements(userId: string): Promise<{
    hasPlatformAccess: boolean;
    platformAccessExpiresAt: Date | null;
    sessionMinutesBalance: number;
    sessionMinutesExpiresAt: Date | null;
    hasTrainMe: boolean;
    trainMeExpiresAt: Date | null;
    hasDai: boolean;
    daiTokensBalance: number;
    daiExpiresAt: Date | null;
    isEnterpriseUser: boolean;
    enterpriseTrainMeEnabled: boolean;
    enterpriseDaiEnabled: boolean;
  }>;
  
  // Shopping Cart Management (for multi-item checkout with GST)
  addToCart(data: InsertCartItem): Promise<CartItem>;
  removeFromCart(userId: string, cartItemId: string): Promise<void>;
  getCartItems(userId: string): Promise<CartItem[]>;
  clearCart(userId: string): Promise<void>;
  calculateCartTotal(userId: string, promoCode?: string): Promise<{
    items: CartItem[];
    subtotal: number; // Sum of all item prices
    gstAmount: number; // 18% GST
    discount: number; // Promo code discount if applicable
    total: number; // Final amount to charge
    currency: string;
    itemCount: number; // Total number of items in cart
  }>;
  checkItemAvailability(userId: string, packageSku: string, addonType: string): Promise<{
    available: boolean;
    reason?: string; // Why item is not available (e.g., "Already have active subscription")
  }>;
  getPublishedAddons(): Promise<Addon[]>;
  getPublishedSubscriptionPlans(): Promise<SubscriptionPlan[]>;
}

export class BillingStorage implements IBillingStorage {
  // Gateway Provider Management
  async createGatewayProvider(data: InsertGatewayProvider): Promise<GatewayProvider> {
    const [provider] = await db.insert(gatewayProviders).values(data).returning();
    return provider;
  }

  async getDefaultGatewayProvider(): Promise<GatewayProvider | null> {
    const [provider] = await db
      .select()
      .from(gatewayProviders)
      .where(and(eq(gatewayProviders.isDefault, true), eq(gatewayProviders.isActive, true)))
      .limit(1);
    return provider || null;
  }

  async getGatewayProviderByName(name: string): Promise<GatewayProvider | null> {
    const [provider] = await db
      .select()
      .from(gatewayProviders)
      .where(eq(gatewayProviders.providerName, name))
      .limit(1);
    return provider || null;
  }

  // Gateway Transaction Management
  async createGatewayTransaction(data: InsertGatewayTransaction): Promise<GatewayTransaction> {
    const [transaction] = await db.insert(gatewayTransactions).values(data).returning();
    return transaction;
  }

  async getGatewayTransaction(id: string): Promise<GatewayTransaction | null> {
    const [transaction] = await db
      .select()
      .from(gatewayTransactions)
      .where(eq(gatewayTransactions.id, id))
      .limit(1);
    return transaction || null;
  }

  async getGatewayTransactionsByUser(userId: string, limit: number = 50): Promise<GatewayTransaction[]> {
    return db
      .select()
      .from(gatewayTransactions)
      .where(eq(gatewayTransactions.userId, userId))
      .orderBy(desc(gatewayTransactions.createdAt))
      .limit(limit);
  }

  async updateGatewayTransactionStatus(id: string, status: string): Promise<GatewayTransaction> {
    const [transaction] = await db
      .update(gatewayTransactions)
      .set({ status })
      .where(eq(gatewayTransactions.id, id))
      .returning();
    return transaction;
  }

  // Gateway Webhook Management
  async createGatewayWebhook(data: any): Promise<GatewayWebhook> {
    const [webhook] = await db.insert(gatewayWebhooks).values(data).returning();
    return webhook;
  }

  async markWebhookProcessed(id: string, success: boolean, errorMessage?: string): Promise<void> {
    await db
      .update(gatewayWebhooks)
      .set({
        processed: true,
        processedAt: new Date(),
        verified: success,
        errorMessage: errorMessage || null,
      })
      .where(eq(gatewayWebhooks.id, id));
  }

  // Pending Orders Management (Secure Payment Verification)
  async createPendingOrder(data: InsertPendingOrder): Promise<PendingOrder> {
    const [order] = await db.insert(pendingOrders).values(data).returning();
    return order;
  }

  async getPendingOrder(id: string): Promise<PendingOrder | null> {
    // Try to find by UUID first
    if (id.length === 36) {
      const [order] = await db
        .select()
        .from(pendingOrders)
        .where(eq(pendingOrders.id, id))
        .limit(1);
      if (order) return order;
    }

    // Then try by gateway order ID
    const [order] = await db
      .select()
      .from(pendingOrders)
      .where(eq(pendingOrders.gatewayOrderId, id))
      .limit(1);
    return order || null;
  }

  async getPendingOrderById(orderId: string, userId: string): Promise<PendingOrder | null> {
    const [order] = await db
      .select()
      .from(pendingOrders)
      .where(
        and(
          eq(pendingOrders.id, orderId),
          eq(pendingOrders.userId, userId)
        )
      )
      .limit(1);
    return order || null;
  }

  async updatePendingOrderGatewayId(pendingOrderId: string, gatewayOrderId: string): Promise<PendingOrder> {
    const [order] = await db
      .update(pendingOrders)
      .set({ gatewayOrderId })
      .where(eq(pendingOrders.id, pendingOrderId))
      .returning();

    if (!order) {
      throw new Error('Pending order not found');
    }

    return order;
  }

  async updatePendingOrderStatus(
    id: string,
    userId: string,
    newStatus: 'completed' | 'failed' | 'expired',
    completedAt?: Date
  ): Promise<PendingOrder> {
    // Try to find the order by ID or gatewayOrderId
    let order = await this.getPendingOrder(id);

    if (!order) {
      throw new Error('Pending order not found');
    }

    if (order.status !== 'pending') {
      throw new Error(`Invalid status transition: order is already ${order.status}`);
    }

    if (order.userId !== userId) {
      throw new Error('Order does not belong to user');
    }

    // SECURITY FIX: Don't re-check expiry when explicitly marking as expired
    // The route has already validated conditions before calling this method
    if (newStatus !== 'expired' && new Date() > new Date(order.expiresAt)) {
      throw new Error('Order has expired');
    }

    const updates: any = { status: newStatus };
    if (completedAt) {
      updates.completedAt = completedAt;
    }

    const [updatedOrder] = await db
      .update(pendingOrders)
      .set(updates)
      .where(
        and(
          eq(pendingOrders.id, order.id),
          eq(pendingOrders.status, 'pending')
        )
      )
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order status - concurrent modification detected');
    }

    return updatedOrder;
  }

  async expirePendingOrders(): Promise<number> {
    const result = await db
      .update(pendingOrders)
      .set({ status: 'expired' })
      .where(
        and(
          eq(pendingOrders.status, 'pending'),
          lte(pendingOrders.expiresAt, new Date())
        )
      );
    
    return result.rowCount || 0;
  }

  // Addon Purchase Management
  async createAddonPurchase(data: InsertAddonPurchase): Promise<AddonPurchase> {
    const [purchase] = await db.insert(addonPurchases).values(data).returning();
    return purchase;
  }

  async getAddonPurchase(id: string): Promise<AddonPurchase | null> {
    const [purchase] = await db
      .select()
      .from(addonPurchases)
      .where(eq(addonPurchases.id, id))
      .limit(1);
    return purchase || null;
  }

  async getActiveAddonPurchase(userId: string, addonType: string): Promise<AddonPurchase | null> {
    const [purchase] = await db
      .select()
      .from(addonPurchases)
      .where(
        and(
          eq(addonPurchases.userId, userId),
          eq(addonPurchases.addonType, addonType),
          eq(addonPurchases.status, 'active'),
          or(
            isNull(addonPurchases.endDate),
            gte(addonPurchases.endDate, new Date())
          )
        )
      )
      .orderBy(desc(addonPurchases.createdAt))
      .limit(1);
    return purchase || null;
  }

  async getUserAddonPurchases(userId: string, addonType?: string): Promise<AddonPurchase[]> {
    const conditions = [eq(addonPurchases.userId, userId)];
    
    if (addonType) {
      conditions.push(eq(addonPurchases.addonType, addonType));
    }

    return db
      .select()
      .from(addonPurchases)
      .where(and(...conditions))
      .orderBy(desc(addonPurchases.createdAt));
  }

  async updateAddonPurchaseStatus(id: string, status: string): Promise<AddonPurchase> {
    const [purchase] = await db
      .update(addonPurchases)
      .set({ status, updatedAt: new Date() })
      .where(eq(addonPurchases.id, id))
      .returning();
    return purchase;
  }

  async updateAddonPurchaseUsage(id: string, usedUnits: number): Promise<AddonPurchase> {
    const [purchase] = await db
      .update(addonPurchases)
      .set({ usedUnits, updatedAt: new Date() })
      .where(eq(addonPurchases.id, id))
      .returning();
    return purchase;
  }

  async updateAddonPurchaseRefund(id: string, data: {
    refundedAt?: Date | null;
    refundAmount: string;
    refundReason: string;
    gatewayRefundId: string;
    refundedBy: string;
    status: string;
    metadata?: any;
  }): Promise<AddonPurchase> {
    const updateData: any = {
      refundAmount: data.refundAmount,
      refundReason: data.refundReason,
      gatewayRefundId: data.gatewayRefundId,
      refundedBy: data.refundedBy,
      status: data.status,
      updatedAt: new Date(),
    };
    
    // Only set refundedAt if provided (for full refunds)
    if (data.refundedAt) {
      updateData.refundedAt = data.refundedAt;
    }
    
    // Update metadata if provided (for partial refunds)
    if (data.metadata) {
      updateData.metadata = data.metadata;
    }
    
    const [purchase] = await db
      .update(addonPurchases)
      .set(updateData)
      .where(eq(addonPurchases.id, id))
      .returning();
    
    return purchase;
  }

  async expireAddonPurchases(): Promise<number> {
    const result = await db
      .update(addonPurchases)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(addonPurchases.status, 'active'),
          lte(addonPurchases.endDate, new Date())
        )
      );
    return result.rowCount || 0;
  }

  // Session Minutes Management
  async trackSessionMinutesUsage(data: InsertSessionMinutesUsage): Promise<SessionMinutesUsage> {
    // Create usage log
    const [usage] = await db.insert(sessionMinutesUsage).values(data).returning();

    // Update the addon purchase's usedUnits
    await db
      .update(addonPurchases)
      .set({
        usedUnits: sql`${addonPurchases.usedUnits} + ${data.minutesConsumed}`,
        updatedAt: new Date(),
      })
      .where(eq(addonPurchases.id, data.purchaseId));

    return usage;
  }

  async getSessionMinutesBalance(userId: string): Promise<{ totalMinutes: number; usedMinutes: number; remainingMinutes: number; expiresAt: Date | null }> {
    const activePurchases = await db
      .select()
      .from(addonPurchases)
      .where(
        and(
          eq(addonPurchases.userId, userId),
          eq(addonPurchases.addonType, 'session_minutes'),
          eq(addonPurchases.status, 'active'),
          or(
            isNull(addonPurchases.endDate),
            gte(addonPurchases.endDate, new Date())
          )
        )
      );

    const totalMinutes = activePurchases.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
    const usedMinutes = activePurchases.reduce((sum, p) => sum + (p.usedUnits || 0), 0);
    const remainingMinutes = totalMinutes - usedMinutes;
    
    // Get earliest expiry date from purchases that have endDate set
    const expiryDates = activePurchases
      .map(p => p.endDate)
      .filter(d => d !== null)
      .sort((a, b) => (a! < b! ? -1 : 1));

    let expiresAt: Date | null = expiryDates[0] || null;

    // If no expiry date is set but there are remaining minutes, calculate default expiry
    // Session minutes typically have a 30-day validity period
    if (!expiresAt && remainingMinutes > 0 && activePurchases.length > 0) {
      // Use the latest startDate from active purchases and add 30 days
      const startDates = activePurchases
        .map(p => p.startDate)
        .filter(d => d !== null)
        .sort((a, b) => (a! > b! ? -1 : 1)); // Sort descending to get latest
      
      if (startDates.length > 0 && startDates[0]) {
        const latestStartDate = startDates[0];
        expiresAt = new Date(latestStartDate);
        expiresAt.setDate(expiresAt.getDate() + 30); // Add 30 days default validity
      }
    }

    return {
      totalMinutes,
      usedMinutes,
      remainingMinutes: Math.max(0, remainingMinutes),
      expiresAt,
    };
  }

  async getUserSessionMinutesUsage(userId: string, limit: number = 100): Promise<SessionMinutesUsage[]> {
    return db
      .select()
      .from(sessionMinutesUsage)
      .where(eq(sessionMinutesUsage.userId, userId))
      .orderBy(desc(sessionMinutesUsage.consumedAt))
      .limit(limit);
  }

  async trackSessionMinutesUsageTransactional(
    userId: string,
    conversationId: string,
    minutesUsed: number
  ): Promise<SessionMinutesUsage> {
    return await db.transaction(async (tx) => {
      const [activePurchase] = await tx
        .select()
        .from(addonPurchases)
        .where(
          and(
            eq(addonPurchases.userId, userId),
            eq(addonPurchases.addonType, 'session_minutes'),
            eq(addonPurchases.status, 'active'),
            or(
              isNull(addonPurchases.endDate),
              gte(addonPurchases.endDate, new Date())
            )
          )
        )
        .orderBy(desc(addonPurchases.createdAt))
        .limit(1)
        .for('update');

      if (!activePurchase) {
        throw new Error('No active session minutes package found');
      }

      const remainingMinutes = activePurchase.totalUnits - activePurchase.usedUnits;
      
      if (remainingMinutes < minutesUsed) {
        throw new Error(`Insufficient session minutes balance. Available: ${remainingMinutes}, Required: ${minutesUsed}`);
      }

      await tx
        .update(addonPurchases)
        .set({
          usedUnits: sql`${addonPurchases.usedUnits} + ${minutesUsed}`,
          updatedAt: new Date(),
        })
        .where(eq(addonPurchases.id, activePurchase.id));

      const [usageLog] = await tx
        .insert(sessionMinutesUsage)
        .values({
          userId,
          purchaseId: activePurchase.id,
          conversationId,
          minutesConsumed: minutesUsed,
          consumedAt: new Date(),
        })
        .returning();

      return usageLog;
    });
  }

  // DAI Management
  async trackDaiUsage(data: InsertDaiUsageLog): Promise<DaiUsageLog> {
    // Create usage log
    const [usage] = await db.insert(daiUsageLogs).values(data).returning();

    // Update the addon purchase's usedUnits
    await db
      .update(addonPurchases)
      .set({
        usedUnits: sql`${addonPurchases.usedUnits} + ${data.tokensConsumed}`,
        updatedAt: new Date(),
      })
      .where(eq(addonPurchases.id, data.purchaseId));

    return usage;
  }

  async getDaiTokenBalance(userId: string): Promise<{ totalTokens: number; usedTokens: number; remainingTokens: number; expiresAt: Date | null }> {
    const activePurchases = await db
      .select()
      .from(addonPurchases)
      .where(
        and(
          eq(addonPurchases.userId, userId),
          eq(addonPurchases.addonType, 'dai'),
          eq(addonPurchases.status, 'active'),
          or(
            isNull(addonPurchases.endDate),
            gte(addonPurchases.endDate, new Date())
          )
        )
      );

    const totalTokens = activePurchases.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
    const usedTokens = activePurchases.reduce((sum, p) => sum + (p.usedUnits || 0), 0);
    const remainingTokens = totalTokens - usedTokens;
    
    // Get earliest expiry date
    const expiryDates = activePurchases
      .map(p => p.endDate)
      .filter(d => d !== null)
      .sort((a, b) => (a! < b! ? -1 : 1));

    return {
      totalTokens,
      usedTokens,
      remainingTokens: Math.max(0, remainingTokens),
      expiresAt: expiryDates[0] || null,
    };
  }

  async getUserDaiUsage(userId: string, limit: number = 100): Promise<DaiUsageLog[]> {
    return db
      .select()
      .from(daiUsageLogs)
      .where(eq(daiUsageLogs.userId, userId))
      .orderBy(desc(daiUsageLogs.consumedAt))
      .limit(limit);
  }

  async trackDaiUsageTransactional(
    userId: string,
    feature: string,
    tokensUsed: number,
    conversationId?: string
  ): Promise<DaiUsageLog> {
    return await db.transaction(async (tx) => {
      const [activePurchase] = await tx
        .select()
        .from(addonPurchases)
        .where(
          and(
            eq(addonPurchases.userId, userId),
            eq(addonPurchases.addonType, 'dai'),
            eq(addonPurchases.status, 'active'),
            or(
              isNull(addonPurchases.endDate),
              gte(addonPurchases.endDate, new Date())
            )
          )
        )
        .orderBy(desc(addonPurchases.createdAt))
        .limit(1)
        .for('update');

      if (!activePurchase) {
        throw new Error('No active DAI token package found');
      }

      const remainingTokens = activePurchase.totalUnits - activePurchase.usedUnits;
      
      if (remainingTokens < tokensUsed) {
        throw new Error(`Insufficient DAI token balance. Available: ${remainingTokens}, Required: ${tokensUsed}`);
      }

      await tx
        .update(addonPurchases)
        .set({
          usedUnits: sql`${addonPurchases.usedUnits} + ${tokensUsed}`,
          updatedAt: new Date(),
        })
        .where(eq(addonPurchases.id, activePurchase.id));

      const [usageLog] = await tx
        .insert(daiUsageLogs)
        .values({
          userId,
          purchaseId: activePurchase.id,
          conversationId: conversationId || null,
          featureUsed: feature,
          tokensConsumed: tokensUsed,
          consumedAt: new Date(),
        })
        .returning();

      return usageLog;
    });
  }

  // Enterprise User Assignment Management
  async createEnterpriseUserAssignment(data: InsertEnterpriseUserAssignment): Promise<EnterpriseUserAssignment> {
    const [assignment] = await db.insert(enterpriseUserAssignments).values(data).returning();
    return assignment;
  }

  async getEnterpriseUserAssignment(id: string): Promise<EnterpriseUserAssignment | null> {
    const [assignment] = await db
      .select()
      .from(enterpriseUserAssignments)
      .where(eq(enterpriseUserAssignments.id, id))
      .limit(1);
    return assignment || null;
  }

  async getEnterpriseAssignmentsByOrg(organizationId: string): Promise<EnterpriseUserAssignment[]> {
    return db
      .select()
      .from(enterpriseUserAssignments)
      .where(eq(enterpriseUserAssignments.organizationId, organizationId))
      .orderBy(desc(enterpriseUserAssignments.createdAt));
  }

  async getEnterpriseAssignmentByUser(userId: string): Promise<EnterpriseUserAssignment | null> {
    const [assignment] = await db
      .select()
      .from(enterpriseUserAssignments)
      .where(
        and(
          eq(enterpriseUserAssignments.userId, userId),
          eq(enterpriseUserAssignments.status, 'active')
        )
      )
      .orderBy(desc(enterpriseUserAssignments.createdAt))
      .limit(1);
    return assignment || null;
  }

  async updateEnterpriseAssignmentStatus(id: string, status: string): Promise<EnterpriseUserAssignment> {
    const [assignment] = await db
      .update(enterpriseUserAssignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(enterpriseUserAssignments.id, id))
      .returning();
    return assignment;
  }

  async revokeEnterpriseAssignment(id: string, revokedBy: string): Promise<EnterpriseUserAssignment> {
    const [assignment] = await db
      .update(enterpriseUserAssignments)
      .set({
        status: 'revoked',
        revokedBy,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(enterpriseUserAssignments.id, id))
      .returning();
    return assignment;
  }

  async activateEnterpriseUser(token: string, userId: string): Promise<EnterpriseUserAssignment> {
    const [assignment] = await db
      .update(enterpriseUserAssignments)
      .set({
        userId,
        status: 'active',
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(enterpriseUserAssignments.activationToken, token),
          gte(enterpriseUserAssignments.activationTokenExpiresAt, new Date())
        )
      )
      .returning();
    
    if (!assignment) {
      throw new Error('Invalid or expired activation token');
    }

    return assignment;
  }

  // Activation Invite Management
  async createActivationInvite(data: InsertActivationInvite): Promise<ActivationInvite> {
    const [invite] = await db.insert(activationInvites).values(data).returning();
    return invite;
  }

  async getActivationInviteByToken(token: string): Promise<ActivationInvite | null> {
    const [invite] = await db
      .select()
      .from(activationInvites)
      .where(eq(activationInvites.token, token))
      .limit(1);
    return invite || null;
  }

  async updateActivationInviteStatus(id: string, status: string): Promise<ActivationInvite> {
    const [invite] = await db
      .update(activationInvites)
      .set({ status, acceptedAt: status === 'accepted' ? new Date() : undefined })
      .where(eq(activationInvites.id, id))
      .returning();
    return invite;
  }

  // Admin Action Logging
  async logAdminAction(data: InsertAdminActionLog): Promise<AdminActionLog> {
    const [log] = await db.insert(adminActionsLog).values(data).returning();
    return log;
  }

  async getAdminActions(adminId?: string, limit: number = 100): Promise<AdminActionLog[]> {
    const query = db.select().from(adminActionsLog);

    if (adminId) {
      return query
        .where(eq(adminActionsLog.adminId, adminId))
        .orderBy(desc(adminActionsLog.createdAt))
        .limit(limit);
    }

    return query.orderBy(desc(adminActionsLog.createdAt)).limit(limit);
  }

  // User Entitlements Cache
  async calculateUserEntitlements(userId: string): Promise<{
    hasPlatformAccess: boolean;
    platformAccessExpiresAt: Date | null;
    sessionMinutesBalance: number;
    sessionMinutesExpiresAt: Date | null;
    hasTrainMe: boolean;
    trainMeExpiresAt: Date | null;
    hasDai: boolean;
    daiTokensBalance: number;
    daiExpiresAt: Date | null;
    isEnterpriseUser: boolean;
    enterpriseTrainMeEnabled: boolean;
    enterpriseDaiEnabled: boolean;
  }> {
    // Check for active platform access
    const platformAccess = await this.getActiveAddonPurchase(userId, 'platform_access');
    const hasPlatformAccess = !!platformAccess;
    const platformAccessExpiresAt = platformAccess?.endDate || null;

    // Get session minutes balance
    const sessionMinutes = await this.getSessionMinutesBalance(userId);

    // Check for Train Me
    const trainMe = await this.getActiveAddonPurchase(userId, 'train_me');
    const hasTrainMe = !!trainMe;
    const trainMeExpiresAt = trainMe?.endDate || null;

    // Get DAI token balance
    const daiBalance = await this.getDaiTokenBalance(userId);

    // Check enterprise assignment
    const enterpriseAssignment = await this.getEnterpriseAssignmentByUser(userId);
    const isEnterpriseUser = !!enterpriseAssignment;
    const enterpriseTrainMeEnabled = enterpriseAssignment?.trainMeEnabled || false;
    const enterpriseDaiEnabled = enterpriseAssignment?.daiEnabled || false;

    return {
      hasPlatformAccess,
      platformAccessExpiresAt,
      sessionMinutesBalance: sessionMinutes.remainingMinutes,
      sessionMinutesExpiresAt: sessionMinutes.expiresAt,
      hasTrainMe: hasTrainMe || enterpriseTrainMeEnabled,
      trainMeExpiresAt,
      hasDai: daiBalance.remainingTokens > 0 || enterpriseDaiEnabled,
      daiTokensBalance: daiBalance.remainingTokens,
      daiExpiresAt: daiBalance.expiresAt,
      isEnterpriseUser,
      enterpriseTrainMeEnabled,
      enterpriseDaiEnabled,
    };
  }

  async refreshUserEntitlements(userId: string): Promise<UserEntitlement> {
    const entitlements = await this.calculateUserEntitlements(userId);

    // Check if entitlement exists
    const [existing] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userEntitlements)
        .set({
          ...entitlements,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userEntitlements.userId, userId))
        .returning();
      return updated;
    } else {
      // Get organization ID from enterprise assignment
      const assignment = await this.getEnterpriseAssignmentByUser(userId);
      
      // Create new
      const [created] = await db
        .insert(userEntitlements)
        .values({
          userId,
          organizationId: assignment?.organizationId || null,
          ...entitlements,
        })
        .returning();
      return created;
    }
  }

  async getUserEntitlements(userId: string): Promise<UserEntitlement | null> {
    const [entitlement] = await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId))
      .limit(1);
    return entitlement || null;
  }

  // Shopping Cart Management
  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.addedAt));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async applyPromoCodeToCartItem(userId: string, cartItemId: string, promoCodeInput: string): Promise<{
    success: boolean;
    message?: string;
    cartItem?: CartItem;
  }> {
    // Get cart item
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!item) {
      return { success: false, message: "Cart item not found" };
    }

    // Find promo code (case-insensitive)
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(sql`UPPER(${promoCodes.code}) = UPPER(${promoCodeInput})`)
      .limit(1);

    if (!promo) {
      return { success: false, message: "Invalid promo code" };
    }

    // Validate promo code
    if (!promo.isActive) {
      return { success: false, message: "Promo code is not active" };
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return { success: false, message: "Promo code has expired" };
    }

    if (promo.maxUses && parseInt(promo.usesCount) >= parseInt(promo.maxUses)) {
      return { success: false, message: "Promo code usage limit reached" };
    }

    // Validate category match - promo code MUST have a category
    if (!promo.category || promo.category.trim() === '') {
      return { 
        success: false, 
        message: "Invalid promo code configuration - no category set" 
      };
    }

    // Skip validation if promo is for 'all' categories
    if (promo.category === 'all') {
      // Allow this promo on any item
    } else {
      // Map addon types to promo categories
      // For 'service' type, we need to check the actual addon to determine if it's DAI or Train Me
      const categoryMap: Record<string, string> = {
        'platform_access': 'platform_subscription',
        'platform_subscription': 'platform_subscription',
        'session_minutes': 'session_minutes',
        'usage_bundle': 'session_minutes',
        'train_me': 'train_me',
        'dai': 'dai',
      };

      let itemCategory = categoryMap[item.addonType] || item.addonType;
      
      // Special handling for 'service' type - check package name to determine if it's DAI or Train Me
      if (item.addonType === 'service') {
        const packageName = (item.packageName || '').toLowerCase();
        if (packageName.includes('dai')) {
          itemCategory = 'dai';
        } else if (packageName.includes('train me')) {
          itemCategory = 'train_me';
        } else {
          // Default to train_me for other service items
          itemCategory = 'train_me';
        }
      }
      
      const promoCategory = categoryMap[promo.category] || promo.category;
      
      if (promoCategory !== itemCategory) {
        console.log(`⚠️ Promo category mismatch: promo.category="${promo.category}" (mapped: "${promoCategory}"), itemCategory="${itemCategory}", addonType="${item.addonType}", packageName="${item.packageName}"`);
        
        // Provide user-friendly category names in error message
        const categoryNames: Record<string, string> = {
          'train_me': 'Train Me',
          'dai': 'Domain AI Intelligence',
          'service': 'Professional Services',
          'session_minutes': 'Session Minutes',
          'platform_subscription': 'Platform Access',
        };
        
        const friendlyPromoCategory = categoryNames[promo.category] || promo.category;
        const friendlyItemCategory = categoryNames[item.addonType] || item.addonType;
        
        return { 
          success: false, 
          message: `This promo code is only valid for ${friendlyPromoCategory} purchases, not ${friendlyItemCategory}` 
        };
      }
    }

    // NEW: Validate allowed plan types (for platform subscriptions)
    if (promo.allowedPlanTypes && Array.isArray(promo.allowedPlanTypes) && (promo.allowedPlanTypes as any[]).length > 0) {
      const itemMetadata = item.metadata as any || {};
      const itemPlanType = itemMetadata.planType;
      
      // For session minutes, check if the package SKU matches allowed plans
      if (item.addonType === 'session_minutes') {
        const allowedPlans = promo.allowedPlanTypes as string[];
        const itemPackageName = item.packageName;
        
        // Check if the package name matches any of the allowed plans
        const isAllowed = allowedPlans.some((allowedPlan: string) => {
          // Match by package name (e.g., "500 Minutes", "1000 Minutes")
          return itemPackageName.includes(allowedPlan) || allowedPlan.includes(itemPackageName);
        });
        
        if (!isAllowed) {
          return { 
            success: false, 
            message: `This promo code is only valid for: ${allowedPlans.join(', ')}` 
          };
        }
      } 
      // For platform subscriptions, check plan type
      else if (item.addonType === 'platform_access' && itemPlanType) {
        const allowedPlanTypes = promo.allowedPlanTypes as string[];
        
        if (!allowedPlanTypes.includes(itemPlanType)) {
          return { 
            success: false, 
            message: `This promo code is only valid for: ${allowedPlanTypes.join(', ')} plans` 
          };
        }
      }
    }

    // Calculate discount for this item
    const itemTotal = parseFloat(item.basePrice) * item.quantity;
    let discountAmount = 0;

    if (promo.discountType === 'percentage') {
      const percentage = parseFloat(promo.discountValue);
      discountAmount = itemTotal * (percentage / 100);
    } else if (promo.discountType === 'fixed') {
      discountAmount = parseFloat(promo.discountValue);
      // Ensure discount doesn't exceed item total
      if (discountAmount > itemTotal) {
        discountAmount = itemTotal;
      }
    }

    // Update cart item with promo code
    const [updated] = await db
      .update(cartItems)
      .set({
        promoCodeId: promo.id,
        promoCodeCode: promo.code,
        appliedDiscountAmount: discountAmount.toFixed(2),
      })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
      .returning();

    return { success: true, message: "Promo code applied successfully", cartItem: updated };
  }

  async removePromoCodeFromCartItem(userId: string, cartItemId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const [updated] = await db
      .update(cartItems)
      .set({
        promoCodeId: null,
        promoCodeCode: null,
        appliedDiscountAmount: null,
      })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
      .returning();

    if (!updated) {
      return { success: false, message: "Cart item not found" };
    }

    return { success: true, message: "Promo code removed successfully" };
  }

  async calculateCartTotal(userId: string, promoCode?: string): Promise<{
    items: CartItem[];
    subtotal: number;
    gstAmount: number;
    discount: number;
    total: number;
    currency: string;
    itemCount: number;
  }> {
    const items = await this.getCartItems(userId);

    if (items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        gstAmount: 0,
        discount: 0,
        total: 0,
        currency: 'USD',
        itemCount: 0,
      };
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.basePrice) * item.quantity);
    }, 0);

    // Sum per-item discounts
    const discount = items.reduce((sum, item) => {
      if (item.appliedDiscountAmount) {
        return sum + parseFloat(item.appliedDiscountAmount);
      }
      return sum;
    }, 0);

    // Calculate GST - Only for INR, not for USD
    const currency = items[0]?.currency || 'USD';
    const GST_RATE = currency === 'INR' ? 0.18 : 0; // 18% GST for INR, 0% for USD
    const gstAmount = (subtotal - discount) * GST_RATE;

    // Calculate total
    const total = subtotal - discount + gstAmount;

    return {
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      currency: currency,
      itemCount: items.length,
    };
  }

  async checkItemAvailability(userId: string, packageSku: string, addonType: string): Promise<{
    available: boolean;
    reason?: string;
  }> {
    // Check if user already has an active addon of this type
    const activeAddon = await this.getActiveAddonPurchase(userId, addonType);

    if (activeAddon) {
      // Check if the addon is expired or expiring soon
      const now = new Date();
      const isExpired = activeAddon.endDate && activeAddon.endDate < now;
      const isExpiringSoon = activeAddon.endDate && activeAddon.endDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Within 7 days

      if (isExpired) {
        // Expired addons can be renewed
        return { available: true };
      } else if (isExpiringSoon && addonType === 'platform_access') {
        // Platform access can be renewed if expiring soon
        return { available: true };
      } else {
        // Active addon exists, not available for purchase
        return {
          available: false,
          reason: `You already have an active ${addonType.replace('_', ' ')} subscription valid until ${activeAddon.endDate?.toLocaleDateString() || 'N/A'}`,
        };
      }
    }

    // For session minutes and DAI, always allow purchase (they can stack)
    if (addonType === 'session_minutes' || addonType === 'dai') {
      return { available: true };
    }

    // No active addon, available for purchase
    return { available: true };
  }

  async getPublishedAddons(): Promise<Addon[]> {
    return db
      .select()
      .from(addons)
      .where(and(eq(addons.publishedOnWebsite, true), eq(addons.isActive, true)))
      .orderBy(desc(addons.createdAt));
  }

  async getAddonById(id: string): Promise<Addon | null> {
    const [addon] = await db
      .select()
      .from(addons)
      .where(eq(addons.id, id))
      .limit(1);
    return addon || null;
  }

  async getPublishedSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.publishedOnWebsite, true), eq(subscriptionPlans.isActive, true)))
      .orderBy(desc(subscriptionPlans.createdAt));
  }
}

// Export singleton instance
export const billingStorage = new BillingStorage();
