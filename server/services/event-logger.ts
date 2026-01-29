import { db } from "../db";
import { auditLogs } from "../../shared/schema";

export interface AuditLogData {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class EventLogger {
  async log(data: AuditLogData): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        actorId: data.actorId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async logBillingEvent(
    action: string,
    actorId: string,
    targetId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: `billing.${action}`,
      targetType: 'payment',
      targetId,
      metadata,
    });
  }

  async logLicenseEvent(
    action: string,
    actorId: string,
    licensePackageId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: `license.${action}`,
      targetType: 'license_package',
      targetId: licensePackageId,
      metadata,
    });
  }

  async logUserEvent(
    action: string,
    actorId: string,
    targetUserId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: `user.${action}`,
      targetType: 'user',
      targetId: targetUserId,
      metadata,
    });
  }

  async logAdminAction(
    action: string,
    adminId: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: adminId,
      action: `admin.${action}`,
      targetType,
      targetId,
      metadata,
    });
  }

  async logSubscriptionEvent(
    action: string,
    userId: string,
    subscriptionId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action: `subscription.${action}`,
      targetType: 'subscription',
      targetId: subscriptionId,
      metadata,
    });
  }

  async logUsageMilestone(
    userId: string,
    milestone: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action: `usage.${milestone}`,
      targetType: 'usage',
      targetId: userId,
      metadata,
    });
  }
}

export const eventLogger = new EventLogger();

export const logPaymentSuccess = async (
  userId: string,
  paymentId: string,
  amount: string,
  planType?: string
) => {
  await eventLogger.logBillingEvent('payment.succeeded', userId, paymentId, {
    amount,
    planType,
  });
};

export const logPaymentFailed = async (
  userId: string,
  orderId: string,
  reason: string
) => {
  await eventLogger.logBillingEvent('payment.failed', userId, orderId, {
    reason,
  });
};

export const logSubscriptionActivated = async (
  userId: string,
  subscriptionId: string,
  planType: string,
  duration: string
) => {
  await eventLogger.logSubscriptionEvent('activated', userId, subscriptionId, {
    planType,
    duration,
  });
};

export const logSubscriptionExpired = async (
  userId: string,
  subscriptionId: string,
  planType: string
) => {
  await eventLogger.logSubscriptionEvent('expired', userId, subscriptionId, {
    planType,
  });
};

export const logLicenseAssigned = async (
  managerId: string,
  licensePackageId: string,
  assignedUserId: string,
  seatNumber: number
) => {
  await eventLogger.logLicenseEvent('assigned', managerId, licensePackageId, {
    assignedUserId,
    seatNumber,
  });
};

export const logLicenseRevoked = async (
  managerId: string,
  licensePackageId: string,
  revokedUserId: string,
  reason?: string
) => {
  await eventLogger.logLicenseEvent('revoked', managerId, licensePackageId, {
    revokedUserId,
    reason,
  });
};

export const logUserCreated = async (
  actorId: string,
  newUserId: string,
  isEnterpriseUser: boolean
) => {
  await eventLogger.logUserEvent('created', actorId, newUserId, {
    isEnterpriseUser,
  });
};

export const logUserSuspended = async (
  adminId: string,
  userId: string,
  reason: string
) => {
  await eventLogger.logAdminAction('user.suspended', adminId, 'user', userId, {
    reason,
  });
};

export const logPromoCodeUsed = async (
  userId: string,
  promoCode: string,
  discountAmount: string
) => {
  await eventLogger.log({
    actorId: userId,
    action: 'promo.used',
    targetType: 'promo_code',
    targetId: promoCode,
    metadata: {
      discountAmount,
    },
  });
};

export const logUsageLimitReached = async (
  userId: string,
  limitType: 'sessions' | 'minutes',
  currentUsage: number,
  limit: number
) => {
  await eventLogger.logUsageMilestone(userId, 'limit_reached', {
    limitType,
    currentUsage,
    limit,
  });
};

export const logRefundProcessed = async (
  adminId: string,
  paymentId: string,
  refundAmount: string,
  reason: string
) => {
  await eventLogger.logAdminAction('refund.processed', adminId, 'payment', paymentId, {
    refundAmount,
    reason,
  });
};
