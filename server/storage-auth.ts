import { db } from "./db";
import { 
  authUsers, 
  otps, 
  refreshTokens, 
  subscriptions, 
  subscriptionPlans,
  payments,
  promoCodes,
  cartItems,
  auditLogs,
  passwordResetTokens,
  sessionMinutesPurchases,
  sessionMinutesUsage,
  sessionUsage,
  refunds,
  timeExtensions,
  organizations,
  organizationMemberships,
  licensePackages,
  licenseAssignments,
  billingAdjustments,
  superUserOverrides,
  conversationMemories,
  userProfiles,
  addonPurchases,
  aiTokenUsage,
  termsAndConditions,
  type AuthUser,
  type OTP,
  type RefreshToken,
  type Subscription,
  type SubscriptionPlan,
  type Payment,
  type PromoCode,
  type AuditLog,
  type PasswordResetToken,
  type SessionMinutesPurchase,
  type Refund,
  type TimeExtension,
  type Organization,
  type OrganizationMembership,
  type LicensePackage,
  type LicenseAssignment,
  type BillingAdjustment,
  type ConversationMemory,
  type InsertConversationMemory,
  type UserProfile,
  type InsertUserProfile,
  type OrganizationOverviewDTO,
  type OrganizationSubscriptionDTO,
  type OrganizationAddonDTO,
  type OrganizationDTO,
  type LicenseAssignmentDTO,
  type OrganizationMembershipDTO,
  type EnhancedAddonDTO,
  type AdminOrganizationListItemDTO,
  type AdminOrganizationDetailDTO,
  type LicenseManagerDTO,
  type OrganizationUserDTO,
  type EnhancedLicensePackageDTO,
  type AITokenUsage,
  type AIProvider,
  AI_PROVIDERS
} from "../shared/schema";
import { eq, and, gte, desc, sql, lte, or, like, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export interface IAuthStorage {
  // User operations
  createUser(data: {
    email: string;
    mobile?: string;
    firstName: string;
    lastName: string;
    organization?: string;
    username: string;
    password: string;
    role?: string;
    termsAccepted?: boolean;
  }): Promise<AuthUser>;
  
  getUserById(id: string): Promise<AuthUser | null>;
  getUserByEmail(email: string): Promise<AuthUser | null>;
  getUserByUsername(username: string): Promise<AuthUser | null>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<AuthUser | null>;
  updateUser(id: string, data: Partial<AuthUser>): Promise<AuthUser>;
  getAllUsers(limit?: number, offset?: number): Promise<AuthUser[]>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  updateAIEngineSettings(userId: string, aiEngine: string, encryptedApiKey: string): Promise<AuthUser>;
  getAIEngineSettings(userId: string): Promise<{ aiEngine: string | null; hasApiKey: boolean; aiEngineSetupCompleted: boolean }>;
  
  // Super user override operations
  isSuperUser(email: string): Promise<boolean>;
  
  // OTP operations
  createOTP(email: string, code: string, expiresAt: Date): Promise<OTP>;
  getValidOTP(email: string, code: string): Promise<OTP | null>;
  markOTPAsUsed(id: string): Promise<void>;
  incrementOTPAttempts(id: string): Promise<void>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getValidPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  markPasswordResetTokenAsUsed(id: string): Promise<void>;
  updateUserPassword(email: string, newPassword: string): Promise<void>;
  
  // Refresh token operations
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | null>;
  getUserRefreshTokens(userId: string): Promise<RefreshToken[]>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
  incrementSessionVersion(userId: string): Promise<number>;
  
  // Subscription operations
  createSubscription(data: {
    userId: string;
    planId?: string;
    planType?: string;
    status: string;
    sessionsUsed?: string;
    sessionsLimit?: string;
    minutesUsed?: string;
    minutesLimit?: string;
    sessionHistory?: any[];
  }): Promise<Subscription>;
  
  getSubscriptionByUserId(userId: string): Promise<Subscription | null>;
  getSubscriptionByRazorpayId(razorpaySubscriptionId: string): Promise<Subscription | null>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription>;
  trackSession(subscriptionId: string, sessionId: string, durationMinutes: number, startTime?: Date, endTime?: Date): Promise<Subscription>;
  
  // Subscription plan operations
  getAllPlans(): Promise<SubscriptionPlan[]>;
  getPlanById(id: string): Promise<SubscriptionPlan | null>;
  
  // Payment operations
  createPayment(data: {
    userId: string;
    organizationId?: string | null;
    subscriptionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: string;
    currency: string;
    status: string;
    paymentMethod?: string;
    receiptUrl?: string;
    metadata?: any;
  }): Promise<Payment>;
  
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentByRazorpayOrderId(orderId: string): Promise<Payment | null>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment>;
  
  // Promo code operations
  validatePromoCode(code: string, planType?: string): Promise<PromoCode | null>;
  incrementPromoCodeUses(id: string): Promise<void>;
  createPromoCode(data: {
    code: string;
    category: string;
    discountType: string;
    discountValue: string;
    maxUses?: string;
    isActive?: boolean;
    expiresAt?: Date;
  }): Promise<PromoCode>;
  
  // Audit log operations
  createAuditLog(data: {
    actorId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog>;
  
  // Admin metrics
  getUserMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    paidUsers: number;
    suspendedUsers: number;
  }>;
  
  getSubscriptionMetrics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
  }>;
  
  getRevenueMetrics(): Promise<{
    totalRevenue: string;
    monthlyRevenue: string;
    successfulPayments: number;
    failedPayments: number;
  }>;
  
  // Enhanced analytics
  getUserGrowthData(days: number): Promise<Array<{ date: string; count: number }>>;
  getRevenueTrends(months: number): Promise<Array<{ month: string; revenue: string }>>;
  getTopUsersByUsage(limit: number): Promise<Array<{ userId: string; firstName: string; lastName: string; email: string; minutesUsed: string }>>;
  
  // Subscription management
  extendTrialPeriod(userId: string, days: number): Promise<void>;
  cancelSubscriptionWithReason(subscriptionId: string, reason: string): Promise<Subscription>;
  applyDiscountToSubscription(subscriptionId: string, discountPercent: number): Promise<void>;
  getExpiringSubscriptions(days: number): Promise<Array<{ subscription: Subscription; user: AuthUser }>>;
  
  // Minutes management
  grantMinutes(userId: string, minutes: number, reason: string, expiryDays?: number): Promise<void>;
  bulkGrantMinutes(userIds: string[], minutes: number, reason: string, expiryDays?: number): Promise<void>;
  getExpiringMinutesPurchases(days: number): Promise<any[]>;
  extendMinutesPurchase(purchaseId: string, additionalDays: number): Promise<void>;
  getAllMinutesPurchases(limit?: number): Promise<any[]>;
  
  // Promo code management
  getAllPromoCodes(): Promise<PromoCode[]>;
  updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode>;
  deletePromoCode(id: string): Promise<void>;
  getPromoCodeAnalytics(): Promise<Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: string;
    usesCount: string;
    maxUses: string | null;
    usageRate: string;
    isActive: boolean;
  }>>;
  getPromoCodeUsageHistory(promoCodeId: string): Promise<Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    usedAt: Date;
    amount: string;
  }>>;
  
  // Comprehensive user management
  getUserDetailedProfile(userId: string): Promise<any>;
  getAllUsersWithDetails(filters?: { search?: string; status?: string; role?: string; planType?: string }): Promise<any[]>;
  getIndividualUsersWithDetails(filters?: { search?: string; status?: string; planType?: string }): Promise<any[]>;
  updateUserStatus(userId: string, status: string, reason?: string): Promise<void>;
  grantTimeExtension(userId: string, extensionType: string, extensionValue: string, reason: string, grantedBy: string, expiresAt?: Date): Promise<void>;
  getUserSessionHistory(userId: string, limit?: number): Promise<any[]>;
  getUserTimeExtensions(userId: string): Promise<any[]>;
  
  // Refund management
  issueRefund(paymentId: string, userId: string, amount: string, currency: string, reason: string, processedBy: string): Promise<void>;
  getRefundsByUserId(userId: string): Promise<any[]>;
  updateRefundStatus(refundId: string, status: string, razorpayRefundId?: string): Promise<void>;
  
  // Billing portal operations
  getBillingTransactions(filters: {
    limit: number;
    offset: number;
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<import("@shared/schema").BillingTransaction[]>;
  getBillingTransactionsCount(filters: {
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number>;
  getBillingAnalytics(periodDays: number): Promise<import("@shared/schema").BillingAnalytics>;
  getEnhancedBillingAnalytics(periodDays: number): Promise<any>;
  getPaymentMethodBreakdown(periodDays: number): Promise<any>;
  getCustomerInsights(): Promise<any>;
  getPaymentById(id: string): Promise<Payment | null>;
  getSessionMinutesPurchaseById(id: string): Promise<SessionMinutesPurchase | null>;
  updatePaymentRefund(id: string, data: {
    refundedAt: Date;
    refundAmount: string;
    refundReason: string;
    razorpayRefundId: string;
    refundedBy: string;
    status: string;
  }): Promise<Payment>;
  updateMinutesPurchaseRefund(id: string, data: {
    refundedAt: Date;
    refundAmount: string;
    refundReason: string;
    razorpayRefundId: string;
    refundedBy: string;
    status: string;
  }): Promise<SessionMinutesPurchase>;
  deletePayment(id: string): Promise<boolean>;
  deleteSessionMinutesPurchase(id: string): Promise<boolean>;
  
  // ========================================
  // AI TOKEN USAGE TRACKING OPERATIONS
  // ========================================
  
  recordAITokenUsage(data: {
    userId: string;
    organizationId?: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestId?: string;
    feature?: string;
    metadata?: any;
    occurredAt?: Date;
  }): Promise<AITokenUsage>;
  
  getAITokenUsage(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    provider?: string;
    limit?: number;
    offset?: number;
  }): Promise<AITokenUsage[]>;
  
  getAITokenUsageSummary(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{
    provider: string;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    requestCount: number;
  }>>;
  
  // ========================================
  // ENTERPRISE LICENSE MANAGEMENT OPERATIONS
  // ========================================
  
  // Organization operations
  createOrganization(data: {
    companyName: string;
    billingEmail: string;
    primaryManagerId?: string;
    razorpayCustomerId?: string;
    status?: string;
  }): Promise<import("@shared/schema").Organization>;
  
  getOrganizationById(id: string): Promise<import("@shared/schema").Organization | null>;
  getOrganizationByManagerId(managerId: string): Promise<import("@shared/schema").Organization | null>;
  updateOrganization(id: string, data: Partial<import("@shared/schema").Organization>): Promise<import("@shared/schema").Organization>;
  
  // Organization membership operations
  createOrganizationMembership(data: {
    organizationId: string;
    userId: string;
    role: string;
    status?: string;
  }): Promise<import("@shared/schema").OrganizationMembership>;
  
  getOrganizationMemberships(organizationId: string): Promise<import("@shared/schema").OrganizationMembership[]>;
  getUserMembership(userId: string): Promise<import("@shared/schema").OrganizationMembership | null>;
  updateMembershipStatus(id: string, status: string): Promise<import("@shared/schema").OrganizationMembership>;
  updateMembershipRole(id: string, role: string): Promise<import("@shared/schema").OrganizationMembership>;
  removeMembership(id: string): Promise<void>;
  
  // License package operations
  createLicensePackage(data: {
    organizationId: string;
    packageType: string;
    totalSeats: number;
    pricePerSeat: string;
    totalAmount: string;
    currency: string;
    startDate: Date;
    endDate: Date;
    previousPackageId?: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    status?: string;
  }): Promise<import("@shared/schema").LicensePackage>;
  
  getLicensePackageById(id: string): Promise<import("@shared/schema").LicensePackage | null>;
  getOrganizationLicensePackages(organizationId: string): Promise<import("@shared/schema").LicensePackage[]>;
  getActiveLicensePackage(organizationId: string): Promise<import("@shared/schema").LicensePackage | null>;
  updateLicensePackage(id: string, data: Partial<import("@shared/schema").LicensePackage>): Promise<import("@shared/schema").LicensePackage>;
  incrementPackageSeats(packageId: string, additionalSeats: number): Promise<import("@shared/schema").LicensePackage>;
  updateLicensePackageAutoRenew(packageId: string, autoRenew: boolean): Promise<import("@shared/schema").LicensePackage>;
  getOrganizationAddons(organizationId: string): Promise<import("@shared/schema").EnhancedAddonDTO[]>;
  
  // License assignment operations
  createLicenseAssignment(data: {
    licensePackageId: string;
    userId: string;
    assignedBy?: string;
    notes?: string;
    status?: string;
  }): Promise<import("@shared/schema").LicenseAssignment>;
  
  getLicenseAssignmentsByPackage(packageId: string): Promise<import("@shared/schema").LicenseAssignment[]>;
  getUserActiveLicenseAssignment(userId: string): Promise<import("@shared/schema").LicenseAssignment | null>;
  getAvailableSeats(packageId: string): Promise<number>;
  reassignLicense(assignmentId: string, newUserId: string, assignedBy: string, notes?: string): Promise<import("@shared/schema").LicenseAssignment>;
  unassignLicense(assignmentId: string): Promise<void>;
  
  // Billing adjustment operations
  createBillingAdjustment(data: {
    organizationId: string;
    licensePackageId?: string;
    adjustmentType: string;
    deltaSeats: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount: string;
    currency: string;
    status?: string;
    addedBy?: string;
  }): Promise<import("@shared/schema").BillingAdjustment>;
  
  getOrganizationBillingAdjustments(organizationId: string): Promise<import("@shared/schema").BillingAdjustment[]>;
  updateBillingAdjustment(id: string, data: Partial<import("@shared/schema").BillingAdjustment>): Promise<import("@shared/schema").BillingAdjustment>;
  
  // Enterprise dashboard operations
  getOrganizationOverview(organizationId: string): Promise<{
    organization: import("@shared/schema").Organization;
    activePackage: import("@shared/schema").LicensePackage | null;
    totalSeats: number;
    assignedSeats: number;
    availableSeats: number;
    members: Array<import("@shared/schema").OrganizationMembership & { user: AuthUser }>;
    assignments: Array<import("@shared/schema").LicenseAssignment & { user: AuthUser }>;
  }>;
  
  // License manager authorization
  isLicenseManager(userId: string): Promise<boolean>;
  canManageLicenses(userId: string, organizationId: string): Promise<boolean>;
  
  // Enterprise user management
  deactivateEnterpriseUser(userId: string, revokedBy: string, organizationId: string): Promise<void>;
  
  // Admin organization listing
  getAllOrganizations(options?: { 
    search?: string; 
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<import("@shared/schema").AdminOrganizationListItemDTO[]>;
  
  getOrganizationsCount(options?: { 
    search?: string; 
    status?: string;
  }): Promise<number>;
  
  // Conversation Memory operations
  createConversationMemory(memory: InsertConversationMemory): Promise<ConversationMemory>;
  getConversationMemory(conversationId: string): Promise<ConversationMemory | null>;
  updateConversationMemory(conversationId: string, updates: Partial<ConversationMemory>): Promise<ConversationMemory | null>;
  
  // User Profile operations
  getUserProfile(userId: string): Promise<UserProfile | null>;
  upsertUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
  
  // Terms and Conditions management
  getActiveTermsAndConditions(): Promise<import("@shared/schema").TermsAndConditions | null>;
  getAllTermsVersions(): Promise<import("@shared/schema").TermsAndConditions[]>;
  createTermsAndConditions(data: {
    title: string;
    content: string;
    version: string;
    lastModifiedBy: string;
  }): Promise<import("@shared/schema").TermsAndConditions>;
  updateTermsAndConditions(id: string, data: {
    title?: string;
    content?: string;
    version?: string;
    lastModifiedBy: string;
  }): Promise<import("@shared/schema").TermsAndConditions>;
  setActiveTerms(id: string): Promise<void>;
}

export class AuthStorage implements IAuthStorage {
  // User operations
  async createUser(data: {
    email: string;
    mobile?: string;
    firstName: string;
    lastName: string;
    organization?: string;
    username: string;
    password: string;
    role?: string;
    termsAccepted?: boolean;
  }): Promise<AuthUser> {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    const [user] = await db.insert(authUsers).values({
      email: data.email,
      mobile: data.mobile,
      firstName: data.firstName,
      lastName: data.lastName,
      organization: data.organization,
      username: data.username,
      hashedPassword,
      role: data.role || 'user',
      status: 'pending',
      emailVerified: false,
      termsAccepted: data.termsAccepted || false,
      termsAcceptedAt: data.termsAccepted ? new Date() : null,
    }).returning();
    
    return user;
  }
  
  async getUserById(id: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
    return user || null;
  }
  
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email));
    return user || null;
  }
  
  async getUserByUsername(username: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username));
    return user || null;
  }
  
  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(authUsers).where(
      sql`${authUsers.username} = ${usernameOrEmail} OR ${authUsers.email} = ${usernameOrEmail}`
    );
    return user || null;
  }
  
  async updateUser(id: string, data: Partial<AuthUser>): Promise<AuthUser> {
    const [user] = await db.update(authUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(authUsers.id, id))
      .returning();
    return user;
  }
  
  async getAllUsers(limit: number = 100, offset: number = 0): Promise<AuthUser[]> {
    return db.select().from(authUsers)
      .orderBy(desc(authUsers.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return bcrypt.compare(password, user.hashedPassword);
  }
  
  async updateAIEngineSettings(userId: string, aiEngine: string, encryptedApiKey: string): Promise<AuthUser> {
    const [user] = await db.update(authUsers)
      .set({ 
        aiEngine,
        encryptedApiKey,
        aiEngineSetupCompleted: true,
        updatedAt: new Date()
      })
      .where(eq(authUsers.id, userId))
      .returning();
    return user;
  }
  
  async getAIEngineSettings(userId: string): Promise<{ aiEngine: string | null; hasApiKey: boolean; aiEngineSetupCompleted: boolean }> {
    const user = await this.getUserById(userId);
    if (!user) {
      return { aiEngine: null, hasApiKey: false, aiEngineSetupCompleted: false };
    }
    return {
      aiEngine: user.aiEngine || null,
      hasApiKey: !!user.encryptedApiKey,
      aiEngineSetupCompleted: user.aiEngineSetupCompleted || false
    };
  }
  
  // Super user override operations
  async isSuperUser(email: string): Promise<boolean> {
    try {
      // Normalize email to lowercase for consistent matching
      const normalizedEmail = email.trim().toLowerCase();
      
      // Query the super_user_overrides table
      const [override] = await db
        .select()
        .from(superUserOverrides)
        .where(
          and(
            eq(superUserOverrides.email, normalizedEmail),
            eq(superUserOverrides.isActive, true)
          )
        )
        .limit(1);
      
      return !!override;
    } catch (error) {
      // Fail closed - if there's an error checking super user status, deny access
      console.error('Error checking super user status:', error);
      return false;
    }
  }
  
  // OTP operations
  async createOTP(email: string, code: string, expiresAt: Date): Promise<OTP> {
    const [otp] = await db.insert(otps).values({
      email,
      code,
      expiresAt,
      attempts: '0',
      isUsed: false,
    }).returning();
    return otp;
  }
  
  async getValidOTP(email: string, code: string): Promise<OTP | null> {
    const [otp] = await db.select().from(otps).where(
      and(
        eq(otps.email, email),
        eq(otps.code, code),
        eq(otps.isUsed, false),
        gte(otps.expiresAt, new Date())
      )
    );
    return otp || null;
  }
  
  async markOTPAsUsed(id: string): Promise<void> {
    await db.update(otps).set({ isUsed: true }).where(eq(otps.id, id));
  }
  
  async incrementOTPAttempts(id: string): Promise<void> {
    await db.execute(sql`UPDATE ${otps} SET attempts = CAST(attempts AS INTEGER) + 1 WHERE id = ${id}`);
  }
  
  // Password reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt,
      isUsed: false,
    }).returning();
    return resetToken;
  }
  
  async getValidPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gte(passwordResetTokens.expiresAt, new Date())
      )
    );
    return resetToken || null;
  }
  
  async markPasswordResetTokenAsUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens).set({ isUsed: true }).where(eq(passwordResetTokens.id, id));
  }
  
  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.update(authUsers)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(authUsers.email, email));
  }
  
  // Refresh token operations
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const [refreshToken] = await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return refreshToken;
  }
  
  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const [refreshToken] = await db.select().from(refreshTokens).where(
      and(
        eq(refreshTokens.token, token),
        gte(refreshTokens.expiresAt, new Date())
      )
    );
    return refreshToken || null;
  }

  async getUserRefreshTokens(userId: string): Promise<RefreshToken[]> {
    return db.select().from(refreshTokens).where(
      and(
        eq(refreshTokens.userId, userId),
        gte(refreshTokens.expiresAt, new Date())
      )
    );
  }
  
  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }
  
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
  
  async incrementSessionVersion(userId: string): Promise<number> {
    const [user] = await db.update(authUsers)
      .set({ 
        sessionVersion: sql`${authUsers.sessionVersion} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(authUsers.id, userId))
      .returning();
    return user.sessionVersion;
  }
  
  // Subscription operations
  async createSubscription(data: {
    userId: string;
    planId?: string;
    planType?: string;
    status: string;
    sessionsUsed?: string;
    sessionsLimit?: string;
    minutesUsed?: string;
    minutesLimit?: string;
    sessionHistory?: any[];
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values({
      ...data,
      planType: data.planType || 'free_trial',
      sessionsUsed: data.sessionsUsed || '0',
      sessionsLimit: data.sessionsLimit || '3',
      minutesUsed: data.minutesUsed || '0',
      minutesLimit: data.minutesLimit || '180',
      sessionHistory: data.sessionHistory || []
    }).returning();
    return subscription;
  }
  
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription || null;
  }

  async getSubscriptionByRazorpayId(razorpaySubscriptionId: string): Promise<Subscription | null> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
      .limit(1);
    return subscription || null;
  }
  
  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db.update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }
  
  async trackSession(
    subscriptionId: string, 
    sessionId: string, 
    durationMinutes: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<Subscription> {
    const subscription = await db.select().from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)
      .then(rows => rows[0]);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const sessionHistory = Array.isArray(subscription.sessionHistory) 
      ? subscription.sessionHistory 
      : [];
    
    const sessionsUsed = parseInt(subscription.sessionsUsed || '0');
    const minutesUsed = parseInt(subscription.minutesUsed || '0');
    
    // Add new session to history with actual timestamps
    sessionHistory.push({
      sessionId,
      startTime: (startTime || new Date()).toISOString(),
      endTime: (endTime || new Date()).toISOString(),
      durationMinutes
    });
    
    const [updated] = await db.update(subscriptions)
      .set({ 
        sessionsUsed: (sessionsUsed + 1).toString(),
        minutesUsed: (minutesUsed + durationMinutes).toString(),
        sessionHistory,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    
    return updated;
  }
  
  // Subscription plan operations
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }
  
  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || null;
  }
  
  // Get user's current organization ID (for recording customer type at transaction time)
  async getUserOrganizationId(userId: string): Promise<string | null> {
    const result = await db.select({
      organizationId: licensePackages.organizationId,
    })
    .from(licenseAssignments)
    .innerJoin(licensePackages, eq(licenseAssignments.licensePackageId, licensePackages.id))
    .where(
      and(
        eq(licenseAssignments.userId, userId),
        eq(licenseAssignments.status, 'active')
      )
    )
    .limit(1);
    
    return result.length > 0 ? result[0].organizationId : null;
  }
  
  // Payment operations
  async createPayment(data: {
    userId: string;
    organizationId?: string | null;
    subscriptionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: string;
    currency: string;
    status: string;
    paymentMethod?: string;
    receiptUrl?: string;
    metadata?: any;
  }): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }
  
  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }
  
  async getPaymentByRazorpayOrderId(orderId: string): Promise<Payment | null> {
    const [payment] = await db.select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, orderId));
    return payment || null;
  }
  
  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    const [payment] = await db.update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }
  
  // Promo code operations
  async validatePromoCode(code: string, planType?: string): Promise<PromoCode | null> {
    const [promoCode] = await db.select()
      .from(promoCodes)
      .where(
        and(
          sql`LOWER(${promoCodes.code}) = LOWER(${code})`,
          eq(promoCodes.isActive, true)
        )
      );
    
    if (!promoCode) {
      return null;
    }
    
    // Check if expired
    if (promoCode.expiresAt && new Date() > new Date(promoCode.expiresAt)) {
      return null;
    }
    
    // Check if max uses reached
    if (promoCode.maxUses) {
      const usesCount = parseInt(promoCode.usesCount || '0');
      const maxUses = parseInt(promoCode.maxUses);
      if (usesCount >= maxUses) {
        return null;
      }
    }
    
    // Check if plan type is allowed (if planType is provided and allowedPlanTypes is set)
    if (planType && promoCode.allowedPlanTypes) {
      const allowedTypes = promoCode.allowedPlanTypes as string[];
      if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
        if (!allowedTypes.includes(planType)) {
          // Return a special error indicator
          return {
            ...promoCode,
            // @ts-ignore - Add error flag for plan type mismatch
            planTypeMismatch: true,
            allowedPlanTypes: allowedTypes
          } as any;
        }
      }
    }
    
    return promoCode;
  }
  
  async incrementPromoCodeUses(id: string): Promise<void> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (!promoCode) {
      throw new Error('Promo code not found');
    }
    
    const newUsesCount = (parseInt(promoCode.usesCount || '0') + 1).toString();
    await db.update(promoCodes)
      .set({ 
        usesCount: newUsesCount,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, id));
  }
  
  async createPromoCode(data: {
    code: string;
    category: string;
    allowedPlanTypes?: string[];
    discountType: string;
    discountValue: string;
    maxUses?: string;
    isActive?: boolean;
    expiresAt?: Date;
  }): Promise<PromoCode> {
    const [promoCode] = await db.insert(promoCodes).values({
      code: data.code,
      category: data.category,
      allowedPlanTypes: data.allowedPlanTypes || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      isActive: data.isActive !== undefined ? data.isActive : true,
      expiresAt: data.expiresAt,
    }).returning();
    
    return promoCode;
  }
  
  // Audit log operations
  async createAuditLog(data: {
    actorId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }
  
  // Admin metrics
  async getUserMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    paidUsers: number;
    suspendedUsers: number;
  }> {
    const result = await db.select({
      totalUsers: sql<number>`COUNT(*)::int`,
      activeUsers: sql<number>`COUNT(*) FILTER (WHERE status = 'active')::int`,
      trialUsers: sql<number>`COUNT(*) FILTER (WHERE trial_end_date IS NOT NULL AND trial_end_date > NOW())::int`,
      paidUsers: sql<number>`COUNT(*) FILTER (WHERE trial_end_date IS NOT NULL AND trial_end_date < NOW() AND status = 'active')::int`,
      suspendedUsers: sql<number>`COUNT(*) FILTER (WHERE status = 'suspended')::int`,
    }).from(authUsers);
    
    // Ensure all values are numbers
    const metrics = result[0];
    return {
      totalUsers: Number(metrics.totalUsers) || 0,
      activeUsers: Number(metrics.activeUsers) || 0,
      trialUsers: Number(metrics.trialUsers) || 0,
      paidUsers: Number(metrics.paidUsers) || 0,
      suspendedUsers: Number(metrics.suspendedUsers) || 0,
    };
  }
  
  async getSubscriptionMetrics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
  }> {
    const result = await db.select({
      totalSubscriptions: sql<number>`COUNT(*)::int`,
      activeSubscriptions: sql<number>`COUNT(*) FILTER (WHERE status = 'active')::int`,
      trialSubscriptions: sql<number>`COUNT(*) FILTER (WHERE status = 'trial')::int`,
      canceledSubscriptions: sql<number>`COUNT(*) FILTER (WHERE status = 'canceled')::int`,
    }).from(subscriptions);
    
    // Ensure all values are numbers
    const metrics = result[0];
    return {
      totalSubscriptions: Number(metrics.totalSubscriptions) || 0,
      activeSubscriptions: Number(metrics.activeSubscriptions) || 0,
      trialSubscriptions: Number(metrics.trialSubscriptions) || 0,
      canceledSubscriptions: Number(metrics.canceledSubscriptions) || 0,
    };
  }
  
  async getRevenueMetrics(): Promise<{
    totalRevenue: string;
    monthlyRevenue: string;
    successfulPayments: number;
    failedPayments: number;
  }> {
    const result = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)) FILTER (WHERE status = 'succeeded'), 0)`,
      monthlyRevenue: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)) FILTER (WHERE status = 'succeeded' AND created_at >= DATE_TRUNC('month', NOW())), 0)`,
      successfulPayments: sql<number>`COUNT(*) FILTER (WHERE status = 'succeeded')`,
      failedPayments: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
    }).from(payments);
    
    return result[0];
  }
  
  // Enhanced analytics
  async getUserGrowthData(days: number): Promise<Array<{ date: string; count: number }>> {
    // First, get the actual user counts per date
    const result = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM ${authUsers}
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);
    
    // Create a map of date -> count
    const dataMap = new Map<string, number>();
    result.rows.forEach((row: any) => {
      const dateStr = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0]
        : row.date;
      dataMap.set(dateStr, row.count);
    });
    
    // Generate all dates in the range and fill missing ones with 0
    const allDates: Array<{ date: string; count: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      allDates.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      });
    }
    
    return allDates;
  }
  
  async getRevenueTrends(months: number): Promise<Array<{ month: string; revenue: string }>> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(CAST(amount AS DECIMAL)), 0)::text as revenue
      FROM ${payments}
      WHERE status = 'succeeded' 
        AND created_at >= NOW() - INTERVAL '${sql.raw(months.toString())} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM')
    `);
    
    return result.rows.map((row: any) => ({
      month: row.month,
      revenue: row.revenue
    }));
  }
  
  async getTopUsersByUsage(limit: number): Promise<Array<{ userId: string; firstName: string; lastName: string; email: string; minutesUsed: string }>> {
    // Aggregate minutes from multiple sources:
    // 1. subscriptions.minutes_used - primary usage tracking
    // 2. sessionMinutesUsage - detailed usage logs
    // 3. sessionMinutesPurchases - purchase-based usage
    // 4. addonPurchases - addon-based usage (session_minutes type)
    try {
      const result = await db.execute(sql`
        WITH user_minutes AS (
          SELECT 
            u.id as user_id,
            u.first_name,
            u.last_name,
            u.email,
            COALESCE(
              (SELECT COALESCE(MAX(CAST(s.minutes_used AS BIGINT)), 0)
               FROM ${subscriptions} s
               WHERE s.user_id = u.id
              ) +
              (SELECT COALESCE(SUM(smu.minutes_consumed), 0)::bigint
               FROM ${sessionMinutesUsage} smu
               WHERE smu.user_id = u.id
              ) +
              (SELECT COALESCE(SUM(smp.minutes_used), 0)::bigint
               FROM ${sessionMinutesPurchases} smp
               WHERE smp.user_id = u.id
              ) +
              (SELECT COALESCE(SUM(ap.used_units), 0)::bigint
               FROM ${addonPurchases} ap
               WHERE ap.user_id = u.id 
                 AND ap.addon_type = 'session_minutes'
                 AND ap.status = 'active'
              ),
              0
            )::bigint as total_minutes
          FROM ${authUsers} u
          WHERE EXISTS (
            SELECT 1 FROM ${subscriptions} s WHERE s.user_id = u.id AND CAST(s.minutes_used AS BIGINT) > 0
          ) OR EXISTS (
            SELECT 1 FROM ${sessionMinutesUsage} smu WHERE smu.user_id = u.id
          ) OR EXISTS (
            SELECT 1 FROM ${sessionMinutesPurchases} smp WHERE smp.user_id = u.id AND smp.minutes_used > 0
          ) OR EXISTS (
            SELECT 1 FROM ${addonPurchases} ap WHERE ap.user_id = u.id AND ap.addon_type = 'session_minutes' AND ap.used_units > 0
          )
        )
        SELECT 
          user_id,
          first_name,
          last_name,
          email,
          total_minutes::text as minutes_used
        FROM user_minutes
        WHERE total_minutes > 0
        ORDER BY total_minutes DESC
        LIMIT ${sql.raw(limit.toString())}
      `);
      
      return result.rows.map((row: any) => ({
        userId: row.user_id,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        email: row.email,
        minutesUsed: row.minutes_used || '0'
      }));
    } catch (error) {
      console.error("getTopUsersByUsage error:", error);
      throw error;
    }
  }
  
  // Subscription management
  async extendTrialPeriod(userId: string, days: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    const newTrialEndDate = new Date();
    if (user.trialEndDate && user.trialEndDate > new Date()) {
      // Extend from current trial end date
      newTrialEndDate.setTime(user.trialEndDate.getTime());
    }
    newTrialEndDate.setDate(newTrialEndDate.getDate() + days);
    
    await this.updateUser(userId, {
      trialEndDate: newTrialEndDate
    });
  }
  
  async cancelSubscriptionWithReason(subscriptionId: string, reason: string): Promise<Subscription> {
    const [subscription] = await db.update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    
    return subscription;
  }
  
  async applyDiscountToSubscription(subscriptionId: string, discountPercent: number): Promise<void> {
    // This is a placeholder - actual implementation would integrate with Razorpay
    console.log(`Applying ${discountPercent}% discount to subscription ${subscriptionId}`);
  }
  
  async getExpiringSubscriptions(days: number): Promise<Array<{ subscription: Subscription; user: AuthUser }>> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const result = await db.execute(sql`
      SELECT 
        s.*,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.username,
        u.organization,
        u.status as user_status
      FROM ${subscriptions} s
      JOIN ${authUsers} u ON s.user_id = u.id
      WHERE s.current_period_end IS NOT NULL 
        AND s.current_period_end <= ${expiryDate}
        AND s.current_period_end >= NOW()
        AND s.status = 'active'
      ORDER BY s.current_period_end
    `);
    
    return result.rows.map((row: any) => ({
      subscription: {
        id: row.id,
        userId: row.user_id,
        planId: row.plan_id,
        planType: row.plan_type,
        status: row.status,
        sessionsUsed: row.sessions_used,
        sessionsLimit: row.sessions_limit,
        minutesUsed: row.minutes_used,
        minutesLimit: row.minutes_limit,
        sessionHistory: row.session_history,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        canceledAt: row.canceled_at,
        cancellationReason: row.cancellation_reason,
        razorpaySubscriptionId: row.razorpay_subscription_id,
        razorpayCustomerId: row.razorpay_customer_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as Subscription,
      user: {
        id: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        organization: row.organization,
        status: row.user_status
      } as any
    }));
  }
  
  // Minutes management
  async grantMinutes(userId: string, minutes: number, reason: string, expiryDays: number = 30): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    // Get user's organization ID to record customer type
    const organizationId = await this.getUserOrganizationId(userId);
    
    await db.insert(sessionMinutesPurchases).values({
      userId,
      organizationId,
      minutesPurchased: minutes,
      minutesUsed: 0,
      minutesRemaining: minutes,
      purchaseDate: new Date(),
      expiryDate,
      status: 'active',
      amountPaid: '0', // Free grant
      currency: 'USD',
    });
  }
  
  async bulkGrantMinutes(userIds: string[], minutes: number, reason: string, expiryDays: number = 30): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    // Get organization IDs for all users in parallel
    const orgIdPromises = userIds.map(userId => this.getUserOrganizationId(userId));
    const organizationIds = await Promise.all(orgIdPromises);
    
    const values = userIds.map((userId, index) => ({
      userId,
      organizationId: organizationIds[index],
      minutesPurchased: minutes,
      minutesUsed: 0,
      minutesRemaining: minutes,
      purchaseDate: new Date(),
      expiryDate,
      status: 'active',
      amountPaid: '0',
      currency: 'USD',
    }));
    
    await db.insert(sessionMinutesPurchases).values(values);
  }
  
  async getExpiringMinutesPurchases(days: number): Promise<any[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const result = await db.select()
      .from(sessionMinutesPurchases)
      .where(
        and(
          lte(sessionMinutesPurchases.expiryDate, expiryDate),
          gte(sessionMinutesPurchases.expiryDate, new Date()),
          eq(sessionMinutesPurchases.status, 'active')
        )
      )
      .orderBy(sessionMinutesPurchases.expiryDate);
    
    return result;
  }
  
  async extendMinutesPurchase(purchaseId: string, additionalDays: number): Promise<void> {
    const [purchase] = await db.select()
      .from(sessionMinutesPurchases)
      .where(eq(sessionMinutesPurchases.id, purchaseId));
    
    if (!purchase) throw new Error('Purchase not found');
    
    const newExpiryDate = new Date(purchase.expiryDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
    
    await db.update(sessionMinutesPurchases)
      .set({ expiryDate: newExpiryDate })
      .where(eq(sessionMinutesPurchases.id, purchaseId));
  }
  
  async getAllMinutesPurchases(limit: number = 100): Promise<any[]> {
    return db.select()
      .from(sessionMinutesPurchases)
      .orderBy(desc(sessionMinutesPurchases.purchaseDate))
      .limit(limit);
  }
  
  // Promo code management
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }
  
  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    const [promoCode] = await db.update(promoCodes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();
    return promoCode;
  }
  
  async deletePromoCode(id: string): Promise<void> {
    // First, remove the promo code reference from all cart items
    // to avoid foreign key constraint violation
    await db
      .update(cartItems)
      .set({
        promoCodeId: null,
        promoCodeCode: null,
        appliedDiscountAmount: null,
      })
      .where(and(
        isNotNull(cartItems.promoCodeId),
        eq(cartItems.promoCodeId, id)
      ));
    
    // Now safe to delete the promo code
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }
  
  async getPromoCodeAnalytics(): Promise<Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: string;
    usesCount: string;
    maxUses: string | null;
    usageRate: string;
    isActive: boolean;
  }>> {
    const codes = await db.select().from(promoCodes);
    
    return codes.map(code => ({
      id: code.id,
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      usesCount: code.usesCount,
      maxUses: code.maxUses,
      usageRate: code.maxUses 
        ? ((parseInt(code.usesCount) / parseInt(code.maxUses)) * 100).toFixed(1) + '%'
        : 'Unlimited',
      isActive: code.isActive || false
    }));
  }
  
  async getPromoCodeUsageHistory(promoCodeId: string): Promise<Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    usedAt: Date;
    amount: string;
  }>> {
    // This queries payments where the promo code was used (stored in metadata)
    const result = await db.execute(sql`
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        p.created_at as used_at,
        p.amount
      FROM ${payments} p
      JOIN ${authUsers} u ON p.user_id = u.id
      WHERE p.metadata->>'promoCodeId' = ${promoCodeId}
      ORDER BY p.created_at DESC
    `);
    
    return result.rows.map((row: any) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      usedAt: row.used_at,
      amount: row.amount
    }));
  }
  
  // Comprehensive user management methods
  async getUserDetailedProfile(userId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        u.*,
        s.id as subscription_id,
        s.plan_type,
        s.status as subscription_status,
        s.sessions_used,
        s.sessions_limit,
        s.minutes_used,
        s.minutes_limit,
        s.current_period_start,
        s.current_period_end,
        sp.name as plan_name,
        sp.price as plan_price,
        COALESCE(SUM(smp.minutes_remaining), 0) as total_minutes_remaining,
        COUNT(DISTINCT p.id) as total_payments
      FROM ${authUsers} u
      LEFT JOIN ${subscriptions} s ON u.id = s.user_id
      LEFT JOIN ${subscriptionPlans} sp ON s.plan_id = sp.id
      LEFT JOIN ${sessionMinutesPurchases} smp ON u.id = smp.user_id AND smp.status = 'active'
      LEFT JOIN ${payments} p ON u.id = p.user_id AND p.status = 'succeeded'
      WHERE u.id = ${userId}
      GROUP BY u.id, s.id, sp.id
    `);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Log the raw database result to verify data is being fetched correctly
    console.log('getUserDetailedProfile - Raw DB Result:', {
      userId: user.id,
      email: user.email,
      plan_type: user.plan_type,
      subscription_status: user.subscription_status,
      subscription_id: user.subscription_id,
      sessions_used: user.sessions_used,
      sessions_limit: user.sessions_limit,
      minutes_used: user.minutes_used,
      minutes_limit: user.minutes_limit,
      hasSubscription: !!user.subscription_id,
    });
    
    // Get total session count and duration
    const sessionStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(CAST(duration_seconds AS INTEGER)), 0) as total_duration_seconds
      FROM ${sessionUsage}
      WHERE user_id = ${userId}
    `);
    
    // Get recent payments
    const recentPayments = await db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(10);
    
    // Get active time extensions
    const activeExtensions = await db.select()
      .from(timeExtensions)
      .where(and(
        eq(timeExtensions.userId, userId),
        eq(timeExtensions.status, 'active')
      ))
      .orderBy(desc(timeExtensions.createdAt));
    
    // Get refunds
    const userRefunds = await db.select()
      .from(refunds)
      .where(eq(refunds.userId, userId))
      .orderBy(desc(refunds.createdAt));
    
    const totalDurationSeconds = Number(sessionStats.rows[0]?.total_duration_seconds) || 0;
    
    return {
      user: user,
      sessionStats: {
        totalSessions: Number(sessionStats.rows[0]?.total_sessions) || 0,
        totalDurationSeconds,
        totalDurationMinutes: Math.floor(totalDurationSeconds / 60)
      },
      recentPayments,
      activeExtensions,
      refunds: userRefunds
    };
  }
  
  async getAllUsersWithDetails(filters?: { search?: string; status?: string; role?: string; planType?: string }): Promise<any[]> {
    let conditions = [];
    
    if (filters?.search) {
      conditions.push(sql`(
        u.email ILIKE ${`%${filters.search}%`} OR
        u.first_name ILIKE ${`%${filters.search}%`} OR
        u.last_name ILIKE ${`%${filters.search}%`} OR
        u.username ILIKE ${`%${filters.search}%`}
      )`);
    }
    
    // Filter by subscription status, not user status
    if (filters?.status) {
      conditions.push(sql`s.status = ${filters.status}`);
    }
    
    if (filters?.role) {
      conditions.push(sql`u.role = ${filters.role}`);
    }
    
    if (filters?.planType) {
      conditions.push(sql`s.plan_type = ${filters.planType}`);
    }
    
    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;
    
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.username,
        u.mobile,
        u.organization,
        u.role,
        u.status,
        u.ai_engine,
        u.created_at,
        s.id as subscription_id,
        s.plan_type,
        s.status as subscription_status,
        s.minutes_used,
        s.minutes_limit,
        s.current_period_start,
        s.current_period_end,
        COALESCE(SUM(smp.minutes_remaining), 0) as total_minutes_remaining,
        (SELECT COUNT(*) FROM ${sessionUsage} su WHERE su.user_id = u.id) as total_sessions,
        (SELECT COUNT(*) FROM ${sessionUsage} su WHERE su.user_id = u.id AND su.status = 'active') as active_sessions
      FROM ${authUsers} u
      LEFT JOIN ${subscriptions} s ON u.id = s.user_id
      LEFT JOIN ${sessionMinutesPurchases} smp ON u.id = smp.user_id AND smp.status = 'active'
      ${whereClause}
      GROUP BY u.id, s.id
      ORDER BY u.created_at DESC
    `);
    
    return result.rows;
  }
  
  async getIndividualUsersWithDetails(filters?: { search?: string; status?: string; planType?: string }): Promise<any[]> {
    let conditions = [];
    
    if (filters?.search) {
      conditions.push(sql`(
        u.email ILIKE ${`%${filters.search}%`} OR
        u.first_name ILIKE ${`%${filters.search}%`} OR
        u.last_name ILIKE ${`%${filters.search}%`} OR
        u.username ILIKE ${`%${filters.search}%`}
      )`);
    }
    
    // Filter by subscription status, not user status
    if (filters?.status) {
      conditions.push(sql`s.status = ${filters.status}`);
    }
    
    if (filters?.planType) {
      conditions.push(sql`s.plan_type = ${filters.planType}`);
    }
    
    // Add condition to exclude users who are part of any organization
    conditions.push(sql`NOT EXISTS (
      SELECT 1 FROM ${organizationMemberships} om 
      WHERE om.user_id = u.id AND om.status = 'active'
    )`);
    
    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql`WHERE NOT EXISTS (
          SELECT 1 FROM ${organizationMemberships} om 
          WHERE om.user_id = u.id AND om.status = 'active'
        )`;
    
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.username,
        u.mobile,
        u.organization,
        u.role,
        u.status,
        u.ai_engine,
        u.created_at,
        s.id as subscription_id,
        s.plan_type,
        s.status as subscription_status,
        s.minutes_used,
        s.minutes_limit,
        s.current_period_start,
        s.current_period_end,
        COALESCE(SUM(smp.minutes_remaining), 0) as total_minutes_remaining,
        (SELECT COUNT(*) FROM ${sessionUsage} su WHERE su.user_id = u.id) as total_sessions,
        (SELECT COUNT(*) FROM ${sessionUsage} su WHERE su.user_id = u.id AND su.status = 'active') as active_sessions
      FROM ${authUsers} u
      LEFT JOIN ${subscriptions} s ON u.id = s.user_id
      LEFT JOIN ${sessionMinutesPurchases} smp ON u.id = smp.user_id AND smp.status = 'active'
      ${whereClause}
      GROUP BY u.id, s.id
      ORDER BY u.created_at DESC
    `);
    
    return result.rows;
  }
  
  async updateUserStatus(userId: string, status: string, reason?: string): Promise<void> {
    await db.update(authUsers)
      .set({ status, updatedAt: new Date() })
      .where(eq(authUsers.id, userId));
    
    // Log the status change
    await db.insert(auditLogs).values({
      actorId: userId,
      action: `user.status.${status}`,
      targetType: 'user',
      targetId: userId,
      metadata: { reason, previousStatus: status }
    });
  }
  
  async grantTimeExtension(
    userId: string, 
    extensionType: string, 
    extensionValue: string, 
    reason: string, 
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    await db.insert(timeExtensions).values({
      userId,
      extensionType,
      extensionValue,
      reason,
      grantedBy,
      status: 'active',
      expiresAt
    });
    
    // Apply the extension based on type
    if (extensionType === 'trial_extension') {
      const subscription = await this.getSubscriptionByUserId(userId);
      if (subscription) {
        const currentEnd = subscription.currentPeriodEnd || new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + parseInt(extensionValue));
        
        await db.update(subscriptions)
          .set({ 
            currentPeriodEnd: newEnd,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, userId));
      }
    } else if (extensionType === 'minutes_addition') {
      // Grant additional minutes to user
      await this.grantMinutes(userId, parseInt(extensionValue), reason, 30);
    }
    
    // Log the extension
    await db.insert(auditLogs).values({
      actorId: grantedBy,
      action: 'user.time_extension.granted',
      targetType: 'user',
      targetId: userId,
      metadata: { extensionType, extensionValue, reason }
    });
  }
  
  async getUserSessionHistory(userId: string, limit: number = 50): Promise<any[]> {
    // Query the sessionUsage table directly
    const result = await db.execute(sql`
      SELECT 
        id,
        user_id,
        session_id,
        start_time,
        end_time,
        duration_seconds,
        status,
        created_at
      FROM ${sessionUsage}
      WHERE user_id = ${userId}
      ORDER BY start_time DESC
      LIMIT ${limit}
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: row.duration_seconds,
      status: row.status,
      createdAt: row.created_at
    }));
  }
  
  async getUserTimeExtensions(userId: string): Promise<any[]> {
    const extensions = await db.execute(sql`
      SELECT 
        te.*,
        u.first_name || ' ' || u.last_name as granted_by_name,
        u.email as granted_by_email
      FROM ${timeExtensions} te
      JOIN ${authUsers} u ON te.granted_by = u.id
      WHERE te.user_id = ${userId}
      ORDER BY te.created_at DESC
    `);
    
    return extensions.rows;
  }
  
  // Refund management
  async issueRefund(
    paymentId: string, 
    userId: string, 
    amount: string, 
    currency: string, 
    reason: string, 
    processedBy: string
  ): Promise<void> {
    await db.insert(refunds).values({
      paymentId,
      userId,
      amount,
      currency,
      reason,
      status: 'pending',
      processedBy,
      processedAt: new Date()
    });
    
    // Update payment status
    await db.update(payments)
      .set({ status: 'refunded' })
      .where(eq(payments.id, paymentId));
    
    // Log the refund
    await db.insert(auditLogs).values({
      actorId: processedBy,
      action: 'payment.refund.issued',
      targetType: 'payment',
      targetId: paymentId,
      metadata: { amount, currency, reason, userId }
    });
  }
  
  async getRefundsByUserId(userId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        r.*,
        p.razorpay_payment_id,
        p.amount as original_amount,
        u.first_name || ' ' || u.last_name as processed_by_name
      FROM ${refunds} r
      JOIN ${payments} p ON r.payment_id = p.id
      LEFT JOIN ${authUsers} u ON r.processed_by = u.id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `);
    
    return result.rows;
  }
  
  async updateRefundStatus(refundId: string, status: string, razorpayRefundId?: string): Promise<void> {
    await db.update(refunds)
      .set({ 
        status,
        razorpayRefundId,
        processedAt: new Date()
      })
      .where(eq(refunds.id, refundId));
  }
  
  // ========================================
  // BILLING PORTAL OPERATIONS
  // ========================================
  
  async getBillingTransactions(filters: {
    limit: number;
    offset: number;
    status?: string;
    type?: string;
    customerType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<import("@shared/schema").BillingTransaction[]> {
    // Build WHERE clauses for each part of the UNION with proper table aliases
    // For payments table (alias: p)
    const paymentStatusFilter = filters.status ? sql`AND p.status = ${filters.status}` : sql``;
    const paymentDateStartFilter = filters.startDate && filters.startDate.trim() ? 
      sql`AND p.created_at >= ${filters.startDate.trim()}::timestamp` : sql``;
    const paymentDateEndFilter = filters.endDate && filters.endDate.trim() ? 
      sql`AND p.created_at <= ${filters.endDate.trim()}::timestamp` : sql``;
    let paymentCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      paymentCustomerTypeFilter = sql`AND p.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      paymentCustomerTypeFilter = sql`AND p.organization_id IS NOT NULL`;
    }
    
    // For sessionMinutesPurchases table (alias: m)
    const minutesStatusFilter = filters.status ? sql`AND m.status = ${filters.status}` : sql``;
    const minutesDateStartFilter = filters.startDate && filters.startDate.trim() ? 
      sql`AND m.created_at >= ${filters.startDate.trim()}::timestamp` : sql``;
    const minutesDateEndFilter = filters.endDate && filters.endDate.trim() ? 
      sql`AND m.created_at <= ${filters.endDate.trim()}::timestamp` : sql``;
    let minutesCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      minutesCustomerTypeFilter = sql`AND m.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      minutesCustomerTypeFilter = sql`AND m.organization_id IS NOT NULL`;
    }
    
    // For addonPurchases table (alias: a)
    const addonDateStartFilter = filters.startDate && filters.startDate.trim() ? 
      sql`AND a.created_at >= ${filters.startDate.trim()}::timestamp` : sql``;
    const addonDateEndFilter = filters.endDate && filters.endDate.trim() ? 
      sql`AND a.created_at <= ${filters.endDate.trim()}::timestamp` : sql``;
    let addonCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      addonCustomerTypeFilter = sql`AND a.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      addonCustomerTypeFilter = sql`AND a.organization_id IS NOT NULL`;
    }
    
    let query;
    
    if (filters.type === 'subscription_payment') {
      // Only fetch subscription payments
      query = sql`
        SELECT 
          p.id,
          'subscription_payment'::text as type,
          p.user_id as "userId",
          u.email as "userEmail",
          u.first_name as "userFirstName",
          u.last_name as "userLastName",
          p.amount,
          p.currency,
          p.status,
          p.payment_method as "paymentMethod",
          p.razorpay_payment_id as "razorpayPaymentId",
          p.razorpay_order_id as "razorpayOrderId",
          p.created_at as "createdAt",
          p.refunded_at as "refundedAt",
          p.refund_amount as "refundAmount",
          p.refund_reason as "refundReason",
          p.razorpay_refund_id as "razorpayRefundId",
          refunder.first_name || ' ' || refunder.last_name as "refundedByName",
          p.subscription_id as "subscriptionId",
          NULL::integer as "minutesPurchased",
          NULL::integer as "minutesRemaining",
          NULL::timestamp as "expiryDate",
          CASE 
            WHEN p.organization_id IS NOT NULL THEN 'Enterprise/Team License'
            ELSE 'Individual Subscriber'
          END as "customerType",
          org.company_name as "organizationName"
        FROM ${payments} p
        JOIN ${authUsers} u ON p.user_id = u.id
        LEFT JOIN ${authUsers} refunder ON p.refunded_by = refunder.id
        LEFT JOIN ${organizations} org ON p.organization_id = org.id
        WHERE 1=1 
          ${paymentStatusFilter}
          ${paymentDateStartFilter}
          ${paymentDateEndFilter}
          ${paymentCustomerTypeFilter}
          ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        ORDER BY p.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
    } else if (filters.type === 'minutes_purchase') {
      // Only fetch minutes purchases
      query = sql`
        SELECT 
          m.id,
          'minutes_purchase'::text as type,
          m.user_id as "userId",
          u.email as "userEmail",
          u.first_name as "userFirstName",
          u.last_name as "userLastName",
          m.amount_paid as amount,
          m.currency,
          m.status,
          NULL::text as "paymentMethod",
          m.razorpay_payment_id as "razorpayPaymentId",
          m.razorpay_order_id as "razorpayOrderId",
          m.created_at as "createdAt",
          m.refunded_at as "refundedAt",
          m.refund_amount as "refundAmount",
          m.refund_reason as "refundReason",
          m.razorpay_refund_id as "razorpayRefundId",
          refunder.first_name || ' ' || refunder.last_name as "refundedByName",
          NULL::text as "subscriptionId",
          m.minutes_purchased as "minutesPurchased",
          m.minutes_remaining as "minutesRemaining",
          m.expiry_date as "expiryDate",
          CASE 
            WHEN m.organization_id IS NOT NULL THEN 'Enterprise/Team License'
            ELSE 'Individual Subscriber'
          END as "customerType",
          org.company_name as "organizationName"
        FROM ${sessionMinutesPurchases} m
        JOIN ${authUsers} u ON m.user_id = u.id
        LEFT JOIN ${authUsers} refunder ON m.refunded_by = refunder.id
        LEFT JOIN ${organizations} org ON m.organization_id = org.id
        WHERE 1=1 
          ${minutesStatusFilter}
          ${minutesDateStartFilter}
          ${minutesDateEndFilter}
          ${minutesCustomerTypeFilter}
          ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        ORDER BY m.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
    } else {
      // Fetch both with UNION
      query = sql`
        (
          SELECT 
            p.id,
            'subscription_payment'::text as type,
            p.user_id as "userId",
            u.email as "userEmail",
            u.first_name as "userFirstName",
            u.last_name as "userLastName",
            p.amount,
            p.currency,
            p.status,
            p.payment_method as "paymentMethod",
            p.razorpay_payment_id as "razorpayPaymentId",
            p.razorpay_order_id as "razorpayOrderId",
            p.created_at as "createdAt",
            p.refunded_at as "refundedAt",
            p.refund_amount as "refundAmount",
            p.refund_reason as "refundReason",
            p.razorpay_refund_id as "razorpayRefundId",
            refunder.first_name || ' ' || refunder.last_name as "refundedByName",
            p.subscription_id as "subscriptionId",
            NULL::integer as "minutesPurchased",
            NULL::integer as "minutesRemaining",
            NULL::timestamp as "expiryDate",
            CASE 
              WHEN p.organization_id IS NOT NULL THEN 'Enterprise/Team License'
              ELSE 'Individual Subscriber'
            END as "customerType",
            org.company_name as "organizationName"
          FROM ${payments} p
          JOIN ${authUsers} u ON p.user_id = u.id
          LEFT JOIN ${authUsers} refunder ON p.refunded_by = refunder.id
          LEFT JOIN ${organizations} org ON p.organization_id = org.id
          WHERE 1=1 
            ${paymentStatusFilter}
            ${paymentDateStartFilter}
            ${paymentDateEndFilter}
            ${paymentCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        )
        UNION ALL
        (
          SELECT 
            m.id,
            'minutes_purchase'::text as type,
            m.user_id as "userId",
            u.email as "userEmail",
            u.first_name as "userFirstName",
            u.last_name as "userLastName",
            m.amount_paid as amount,
            m.currency,
            m.status,
            NULL::text as "paymentMethod",
            m.razorpay_payment_id as "razorpayPaymentId",
            m.razorpay_order_id as "razorpayOrderId",
            m.created_at as "createdAt",
            m.refunded_at as "refundedAt",
            m.refund_amount as "refundAmount",
            m.refund_reason as "refundReason",
            m.razorpay_refund_id as "razorpayRefundId",
            refunder.first_name || ' ' || refunder.last_name as "refundedByName",
            NULL::text as "subscriptionId",
            m.minutes_purchased as "minutesPurchased",
            m.minutes_remaining as "minutesRemaining",
            m.expiry_date as "expiryDate",
            CASE 
              WHEN m.organization_id IS NOT NULL THEN 'Enterprise/Team License'
              ELSE 'Individual Subscriber'
            END as "customerType",
            org.company_name as "organizationName"
          FROM ${sessionMinutesPurchases} m
          JOIN ${authUsers} u ON m.user_id = u.id
          LEFT JOIN ${authUsers} refunder ON m.refunded_by = refunder.id
          LEFT JOIN ${organizations} org ON m.organization_id = org.id
          WHERE 1=1 
            ${minutesStatusFilter}
            ${minutesDateStartFilter}
            ${minutesDateEndFilter}
            ${minutesCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        )
        UNION ALL
        (
          SELECT 
            a.id,
            'addon_purchase'::text as type,
            a.user_id as "userId",
            u.email as "userEmail",
            u.first_name as "userFirstName",
            u.last_name as "userLastName",
            a.purchase_amount as amount,
            a.currency,
            CASE 
              WHEN a.status = 'active' THEN 'succeeded'::text
              WHEN a.status = 'expired' THEN 'failed'::text
              WHEN a.status = 'canceled' THEN 'failed'::text
              ELSE 'pending'::text
            END as status,
            NULL::text as "paymentMethod",
            COALESCE((a.metadata->>'paymentId')::text, (a.metadata->>'razorpayPaymentId')::text, NULL) as "razorpayPaymentId",
            COALESCE((a.metadata->>'cartOrderId')::text, (a.metadata->>'gatewayOrderId')::text, NULL) as "razorpayOrderId",
            a.created_at as "createdAt",
            NULL::timestamp as "refundedAt",
            NULL::text as "refundAmount",
            NULL::text as "refundReason",
            NULL::text as "razorpayRefundId",
            NULL::text as "refundedByName",
            NULL::text as "subscriptionId",
            CASE WHEN a.addon_type = 'session_minutes' THEN a.total_units ELSE NULL END::integer as "minutesPurchased",
            CASE WHEN a.addon_type = 'session_minutes' THEN (a.total_units - a.used_units) ELSE NULL END::integer as "minutesRemaining",
            a.end_date as "expiryDate",
            CASE 
              WHEN a.organization_id IS NOT NULL THEN 'Enterprise/Team License'
              ELSE 'Individual Subscriber'
            END as "customerType",
            org.company_name as "organizationName"
          FROM ${addonPurchases} a
          JOIN ${authUsers} u ON a.user_id = u.id
          LEFT JOIN ${organizations} org ON a.organization_id = org.id
          WHERE 1=1 
            ${filters.status ? sql`AND CASE 
              WHEN a.status = 'active' THEN 'succeeded'::text
              WHEN a.status = 'expired' THEN 'failed'::text
              WHEN a.status = 'canceled' THEN 'failed'::text
              ELSE 'pending'::text
            END = ${filters.status}` : sql``}
            ${addonDateStartFilter}
            ${addonDateEndFilter}
            ${addonCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
            ${filters.type === 'subscription_payment' ? sql`AND a.addon_type = 'platform_access'` : sql``}
            ${filters.type === 'minutes_purchase' ? sql`AND a.addon_type = 'session_minutes'` : sql``}
        )
        ORDER BY "createdAt" DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
    }
    
    const result = await db.execute(query);
    return result.rows as any[];
  }
  
  async getBillingTransactionsCount(filters: {
    status?: string;
    type?: string;
    customerType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    // Build WHERE clauses for each part with proper table aliases
    // For payments table (alias: p)
    const paymentStatusFilter = filters.status ? sql`AND p.status = ${filters.status}` : sql``;
    const paymentDateStartFilter = filters.startDate ? sql`AND p.created_at >= ${filters.startDate}::timestamp` : sql``;
    const paymentDateEndFilter = filters.endDate ? sql`AND p.created_at <= ${filters.endDate}::timestamp` : sql``;
    let paymentCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      paymentCustomerTypeFilter = sql`AND p.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      paymentCustomerTypeFilter = sql`AND p.organization_id IS NOT NULL`;
    }
    
    // For sessionMinutesPurchases table (alias: m)
    const minutesStatusFilter = filters.status ? sql`AND m.status = ${filters.status}` : sql``;
    const minutesDateStartFilter = filters.startDate ? sql`AND m.created_at >= ${filters.startDate}::timestamp` : sql``;
    const minutesDateEndFilter = filters.endDate ? sql`AND m.created_at <= ${filters.endDate}::timestamp` : sql``;
    let minutesCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      minutesCustomerTypeFilter = sql`AND m.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      minutesCustomerTypeFilter = sql`AND m.organization_id IS NOT NULL`;
    }
    
    // For addonPurchases table (alias: a)
    const addonDateStartFilter = filters.startDate ? sql`AND a.created_at >= ${filters.startDate}::timestamp` : sql``;
    const addonDateEndFilter = filters.endDate ? sql`AND a.created_at <= ${filters.endDate}::timestamp` : sql``;
    let addonCustomerTypeFilter = sql``;
    if (filters.customerType === 'individual') {
      addonCustomerTypeFilter = sql`AND a.organization_id IS NULL`;
    } else if (filters.customerType === 'enterprise') {
      addonCustomerTypeFilter = sql`AND a.organization_id IS NOT NULL`;
    }
    
    let query;
    
    if (filters.type === 'subscription_payment') {
      query = sql`
        SELECT COUNT(*)::integer as count
        FROM (
          SELECT p.id
          FROM ${payments} p
          JOIN ${authUsers} u ON p.user_id = u.id
          LEFT JOIN ${organizations} org ON p.organization_id = org.id
          WHERE 1=1 
            ${paymentStatusFilter}
            ${paymentDateStartFilter}
            ${paymentDateEndFilter}
            ${paymentCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
          UNION ALL
          SELECT a.id
          FROM ${addonPurchases} a
          JOIN ${authUsers} u ON a.user_id = u.id
          LEFT JOIN ${organizations} org ON a.organization_id = org.id
          WHERE a.addon_type = 'platform_access'
            ${filters.status ? sql`AND CASE 
              WHEN a.status = 'active' THEN 'succeeded'::text
              WHEN a.status = 'expired' THEN 'failed'::text
              WHEN a.status = 'canceled' THEN 'failed'::text
              ELSE 'pending'::text
            END = ${filters.status}` : sql``}
            ${addonDateStartFilter}
            ${addonDateEndFilter}
            ${addonCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        ) combined
      `;
    } else if (filters.type === 'minutes_purchase') {
      query = sql`
        SELECT COUNT(*)::integer as count
        FROM (
          SELECT m.id
          FROM ${sessionMinutesPurchases} m
          JOIN ${authUsers} u ON m.user_id = u.id
          LEFT JOIN ${organizations} org ON m.organization_id = org.id
          WHERE 1=1 
            ${minutesStatusFilter}
            ${minutesDateStartFilter}
            ${minutesDateEndFilter}
            ${minutesCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
          UNION ALL
          SELECT a.id
          FROM ${addonPurchases} a
          JOIN ${authUsers} u ON a.user_id = u.id
          LEFT JOIN ${organizations} org ON a.organization_id = org.id
          WHERE a.addon_type = 'session_minutes'
            ${filters.status ? sql`AND CASE 
              WHEN a.status = 'active' THEN 'succeeded'::text
              WHEN a.status = 'expired' THEN 'failed'::text
              WHEN a.status = 'canceled' THEN 'failed'::text
              ELSE 'pending'::text
            END = ${filters.status}` : sql``}
            ${addonDateStartFilter}
            ${addonDateEndFilter}
            ${addonCustomerTypeFilter}
            ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
        ) combined
      `;
    } else {
      query = sql`
        SELECT (
          (SELECT COUNT(*) FROM ${payments} p
           JOIN ${authUsers} u ON p.user_id = u.id
           LEFT JOIN ${organizations} org ON p.organization_id = org.id
           WHERE 1=1 
             ${paymentStatusFilter}
             ${paymentDateStartFilter}
             ${paymentDateEndFilter}
             ${paymentCustomerTypeFilter}
             ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
          ) +
          (SELECT COUNT(*) FROM ${sessionMinutesPurchases} m
           JOIN ${authUsers} u ON m.user_id = u.id
           LEFT JOIN ${organizations} org ON m.organization_id = org.id
           WHERE 1=1 
             ${minutesStatusFilter}
             ${minutesDateStartFilter}
             ${minutesDateEndFilter}
             ${minutesCustomerTypeFilter}
             ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
          ) +
          (SELECT COUNT(*) FROM ${addonPurchases} a
           JOIN ${authUsers} u ON a.user_id = u.id
           LEFT JOIN ${organizations} org ON a.organization_id = org.id
           WHERE 1=1 
             ${filters.status ? sql`AND CASE 
               WHEN a.status = 'active' THEN 'succeeded'::text
               WHEN a.status = 'expired' THEN 'failed'::text
               WHEN a.status = 'canceled' THEN 'failed'::text
               ELSE 'pending'::text
             END = ${filters.status}` : sql``}
             ${addonDateStartFilter}
             ${addonDateEndFilter}
             ${addonCustomerTypeFilter}
             ${filters.search ? sql`AND (u.email ILIKE ${`%${filters.search}%`} OR u.first_name ILIKE ${`%${filters.search}%`} OR u.last_name ILIKE ${`%${filters.search}%`})` : sql``}
          )
        )::integer as count
      `;
    }
    
    const result = await db.execute(query);
    return (result.rows[0] as any).count as number;
  }
  
  async getBillingAnalytics(periodDays: number): Promise<import("@shared/schema").BillingAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Get all transactions in the period with customer type information
    const transactionsQuery = sql`
      SELECT 
        'subscription_payment' as type,
        p.amount,
        p.status,
        p.created_at,
        p.refund_amount,
        CASE 
          WHEN p.organization_id IS NOT NULL THEN 'enterprise'
          ELSE 'individual'
        END as customer_type
      FROM ${payments} p
      WHERE p.created_at >= ${startDate}
      UNION ALL
      SELECT 
        'minutes_purchase' as type,
        m.amount_paid as amount,
        m.status,
        m.created_at,
        m.refund_amount,
        CASE 
          WHEN m.organization_id IS NOT NULL THEN 'enterprise'
          ELSE 'individual'
        END as customer_type
      FROM ${sessionMinutesPurchases} m
      WHERE m.created_at >= ${startDate}
      UNION ALL
      SELECT 
        CASE 
          WHEN a.addon_type = 'platform_access' THEN 'subscription_payment'
          WHEN a.addon_type = 'session_minutes' THEN 'minutes_purchase'
          ELSE 'subscription_payment'
        END as type,
        a.purchase_amount as amount,
        CASE 
          WHEN a.status = 'active' THEN 'succeeded'
          WHEN a.status = 'expired' THEN 'failed'
          WHEN a.status = 'canceled' THEN 'failed'
          ELSE 'pending'
        END as status,
        a.created_at,
        NULL as refund_amount,
        CASE 
          WHEN a.organization_id IS NOT NULL THEN 'enterprise'
          ELSE 'individual'
        END as customer_type
      FROM ${addonPurchases} a
      WHERE a.created_at >= ${startDate}
    `;
    
    const transactions = await db.execute(transactionsQuery);
    const rows = transactions.rows as any[];
    
    // Calculate analytics
    let totalRevenue = 0;
    let totalRefundAmount = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let subscriptionRevenue = 0;
    let minutesRevenue = 0;
    let individualRevenue = 0;
    let enterpriseRevenue = 0;
    let individualTransactions = 0;
    let enterpriseTransactions = 0;
    const revenueByDay: Map<string, { amount: number; count: number }> = new Map();
    const transactionsByStatus: Map<string, { count: number; amount: number }> = new Map();
    const transactionsByType: Map<string, { count: number; amount: number }> = new Map();
    
    rows.forEach((row) => {
      const amount = parseFloat(row.amount || '0');
      const refundAmount = parseFloat(row.refund_amount || '0');
      const date = new Date(row.created_at).toISOString().split('T')[0];
      const customerType = row.customer_type;
      
      // Total revenue
      if (row.status === 'succeeded') {
        totalRevenue += amount;
        successfulPayments++;
        
        // Revenue by type
        if (row.type === 'subscription_payment') {
          subscriptionRevenue += amount;
        } else {
          minutesRevenue += amount;
        }
        
        // Revenue by customer type
        if (customerType === 'individual') {
          individualRevenue += amount;
          individualTransactions++;
        } else if (customerType === 'enterprise') {
          enterpriseRevenue += amount;
          enterpriseTransactions++;
        }
        
        // Revenue by day
        const dayData = revenueByDay.get(date) || { amount: 0, count: 0 };
        dayData.amount += amount;
        dayData.count++;
        revenueByDay.set(date, dayData);
      }
      
      if (row.status === 'failed') {
        failedPayments++;
      }
      
      // Refunds
      if (refundAmount > 0) {
        totalRefundAmount += refundAmount;
      }
      
      // By status
      const statusData = transactionsByStatus.get(row.status) || { count: 0, amount: 0 };
      statusData.count++;
      if (row.status === 'succeeded') {
        statusData.amount += amount;
      }
      transactionsByStatus.set(row.status, statusData);
      
      // By type
      const typeData = transactionsByType.get(row.type) || { count: 0, amount: 0 };
      typeData.count++;
      if (row.status === 'succeeded') {
        typeData.amount += amount;
      }
      transactionsByType.set(row.type, typeData);
    });
    
    return {
      totalRevenue,
      totalTransactions: rows.length,
      totalRefunds: rows.filter(r => r.status === 'refunded' || r.status === 'partially_refunded').length,
      totalRefundAmount,
      successfulPayments,
      failedPayments,
      subscriptionRevenue,
      minutesRevenue,
      individualRevenue,
      enterpriseRevenue,
      individualTransactions,
      enterpriseTransactions,
      revenueByDay: Array.from(revenueByDay.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      transactionsByStatus: Array.from(transactionsByStatus.entries()).map(([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount,
      })),
      transactionsByType: Array.from(transactionsByType.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        amount: data.amount,
      })),
    };
  }
  
  async getEnhancedBillingAnalytics(periodDays: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Get basic analytics
    const basicAnalytics = await this.getBillingAnalytics(periodDays);
    
    // Calculate conversion rate (successful payments / total attempts)
    const conversionRate = basicAnalytics.totalTransactions > 0 
      ? (basicAnalytics.successfulPayments / basicAnalytics.totalTransactions * 100).toFixed(2)
      : 0;
    
    // Calculate average transaction value
    const avgTransactionValue = basicAnalytics.successfulPayments > 0
      ? (basicAnalytics.totalRevenue / basicAnalytics.successfulPayments).toFixed(2)
      : 0;
    
    // Get previous period data for growth calculation
    const prevPeriodEnd = new Date(startDate);
    const prevPeriodStart = new Date(startDate);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays);
    
    const prevPeriodQuery = sql`
      SELECT 
        COUNT(*)::int as total_transactions,
        SUM(CASE WHEN status = 'succeeded' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_revenue
      FROM (
        SELECT amount, status FROM ${payments} WHERE created_at >= ${prevPeriodStart} AND created_at < ${startDate}
        UNION ALL
        SELECT amount_paid as amount, status FROM ${sessionMinutesPurchases} WHERE created_at >= ${prevPeriodStart} AND created_at < ${startDate}
        UNION ALL
        SELECT 
          purchase_amount as amount,
          CASE 
            WHEN status = 'active' THEN 'succeeded'
            ELSE 'failed'
          END as status
        FROM ${addonPurchases} WHERE created_at >= ${prevPeriodStart} AND created_at < ${startDate}
      ) combined
    `;
    
    const prevPeriodResult = await db.execute(prevPeriodQuery);
    const prevPeriodData = prevPeriodResult.rows[0] as any;
    const prevRevenue = parseFloat(prevPeriodData?.total_revenue || '0');
    
    // Calculate growth rate
    const revenueGrowth = prevRevenue > 0
      ? ((basicAnalytics.totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(2)
      : basicAnalytics.totalRevenue > 0 ? 100 : 0;
    
    return {
      ...basicAnalytics,
      conversionRate: parseFloat(conversionRate as string),
      avgTransactionValue: parseFloat(avgTransactionValue as string),
      revenueGrowth: parseFloat(revenueGrowth as string),
      prevPeriodRevenue: prevRevenue,
    };
  }
  
  async getPaymentMethodBreakdown(periodDays: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    const query = sql`
      SELECT 
        COALESCE(payment_method, 'unknown') as method,
        COUNT(*)::int as count,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM ${payments}
      WHERE created_at >= ${startDate} AND status = 'succeeded'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;
    
    const result = await db.execute(query);
    
    const totalAmount = result.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.total_amount || '0'), 0
    );
    
    return result.rows.map((row: any) => ({
      method: row.method || 'Unknown',
      count: row.count,
      totalAmount: parseFloat(row.total_amount || '0'),
      percentage: totalAmount > 0 ? ((parseFloat(row.total_amount || '0') / totalAmount) * 100).toFixed(2) : 0,
    }));
  }
  
  async getCustomerInsights(): Promise<any> {
    // Get total customers
    const totalCustomersQuery = sql`
      SELECT COUNT(DISTINCT user_id)::int as count
      FROM (
        SELECT user_id FROM ${payments}
        UNION
        SELECT user_id FROM ${sessionMinutesPurchases}
        UNION
        SELECT user_id FROM ${subscriptions}
      ) combined
    `;
    
    const totalCustomersResult = await db.execute(totalCustomersQuery);
    const totalCustomers = (totalCustomersResult.rows[0] as any).count;
    
    // Get new customers this month
    const newCustomersThisMonthQuery = sql`
      SELECT COUNT(DISTINCT user_id)::int as count
      FROM (
        SELECT user_id FROM ${payments} WHERE created_at >= DATE_TRUNC('month', NOW())
        UNION
        SELECT user_id FROM ${sessionMinutesPurchases} WHERE created_at >= DATE_TRUNC('month', NOW())
        UNION
        SELECT user_id FROM ${subscriptions} WHERE created_at >= DATE_TRUNC('month', NOW())
      ) combined
    `;
    
    const newCustomersThisMonthResult = await db.execute(newCustomersThisMonthQuery);
    const newCustomersThisMonth = (newCustomersThisMonthResult.rows[0] as any).count;
    
    // Get repeat customers (customers with more than 1 transaction)
    const repeatCustomersQuery = sql`
      SELECT COUNT(*)::int as count
      FROM (
        SELECT user_id, COUNT(*) as transaction_count
        FROM (
          SELECT user_id FROM ${payments}
          UNION ALL
          SELECT user_id FROM ${sessionMinutesPurchases}
        ) combined
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) repeat_customers
    `;
    
    const repeatCustomersResult = await db.execute(repeatCustomersQuery);
    const returningCustomers = (repeatCustomersResult.rows[0] as any).count;
    
    // Get average lifetime value
    const lifetimeValueQuery = sql`
      SELECT 
        AVG(customer_value) as avg_ltv,
        MAX(customer_value) as max_ltv
      FROM (
        SELECT 
          user_id,
          SUM(CAST(amount AS DECIMAL)) as customer_value
        FROM (
          SELECT user_id, amount FROM ${payments} WHERE status = 'succeeded'
          UNION ALL
          SELECT user_id, amount_paid as amount FROM ${sessionMinutesPurchases} WHERE status = 'succeeded'
        ) combined
        GROUP BY user_id
      ) customer_values
    `;
    
    const lifetimeValueResult = await db.execute(lifetimeValueQuery);
    const lifetimeValue = lifetimeValueResult.rows[0] as any;
    
    // Get customer distribution by type
    const customerTypeQuery = sql`
      SELECT 
        CASE 
          WHEN organization_id IS NOT NULL THEN 'Enterprise'
          ELSE 'Individual'
        END as customer_type,
        COUNT(DISTINCT user_id)::int as count
      FROM (
        SELECT user_id, organization_id FROM ${payments}
        UNION
        SELECT user_id, organization_id FROM ${sessionMinutesPurchases}
      ) combined
      GROUP BY customer_type
    `;
    
    const customerTypeResult = await db.execute(customerTypeQuery);
    
    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions
    const mrrQuery = sql`
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.plan_type = 'monthly' THEN CAST(p.amount AS DECIMAL)
          WHEN s.plan_type = 'quarterly' THEN CAST(p.amount AS DECIMAL) / 3
          WHEN s.plan_type = 'yearly' THEN CAST(p.amount AS DECIMAL) / 12
          ELSE 0
        END
      ), 0) as mrr
      FROM ${subscriptions} s
      LEFT JOIN ${payments} p ON p.subscription_id = s.id AND p.status = 'succeeded'
      WHERE s.status = 'active'
    `;
    
    const mrrResult = await db.execute(mrrQuery);
    const monthlyRecurringRevenue = parseFloat((mrrResult.rows[0] as any)?.mrr || '0').toFixed(2);
    
    // Calculate ARR (Annual Recurring Revenue)
    const annualRecurringRevenue = (parseFloat(monthlyRecurringRevenue) * 12).toFixed(2);
    
    // Calculate churn rate (canceled subscriptions in last month / active subscriptions at start of month)
    const churnQuery = sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'canceled' AND updated_at >= DATE_TRUNC('month', NOW())) as canceled_this_month,
        COUNT(*) FILTER (WHERE status = 'active' OR (status = 'canceled' AND updated_at >= DATE_TRUNC('month', NOW()))) as total_at_start
      FROM ${subscriptions}
    `;
    
    const churnResult = await db.execute(churnQuery);
    const churnData = churnResult.rows[0] as any;
    const churnRate = churnData.total_at_start > 0 
      ? ((churnData.canceled_this_month / churnData.total_at_start) * 100).toFixed(2) + '%'
      : '0%';
    
    // Calculate customer retention rate
    const customerRetentionRate = totalCustomers > 0 
      ? ((returningCustomers / totalCustomers) * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      totalCustomers,
      newCustomersThisMonth,
      returningCustomers,
      customerRetentionRate,
      averageLifetimeValue: parseFloat(lifetimeValue?.avg_ltv || '0').toFixed(2),
      churnRate,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      // Legacy fields for backward compatibility
      repeatCustomers: returningCustomers,
      repeatCustomerRate: totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(2) : '0',
      avgLifetimeValue: parseFloat(lifetimeValue?.avg_ltv || '0').toFixed(2),
      maxLifetimeValue: parseFloat(lifetimeValue?.max_ltv || '0').toFixed(2),
      customersByType: customerTypeResult.rows.map((row: any) => ({
        type: row.customer_type,
        count: row.count,
      })),
    };
  }
  
  async getPaymentById(id: string): Promise<Payment | null> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || null;
  }
  
  async getSessionMinutesPurchaseById(id: string): Promise<SessionMinutesPurchase | null> {
    const [purchase] = await db.select().from(sessionMinutesPurchases).where(eq(sessionMinutesPurchases.id, id));
    return purchase || null;
  }
  
  async updatePaymentRefund(id: string, data: {
    refundedAt: Date;
    refundAmount: string;
    refundReason: string;
    razorpayRefundId: string;
    refundedBy: string;
    status: string;
  }): Promise<Payment> {
    const [payment] = await db.update(payments)
      .set({
        refundedAt: data.refundedAt,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        razorpayRefundId: data.razorpayRefundId,
        refundedBy: data.refundedBy,
        status: data.status,
      })
      .where(eq(payments.id, id))
      .returning();
    
    return payment;
  }
  
  async updateMinutesPurchaseRefund(id: string, data: {
    refundedAt: Date;
    refundAmount: string;
    refundReason: string;
    razorpayRefundId: string;
    refundedBy: string;
    status: string;
  }): Promise<SessionMinutesPurchase> {
    const [purchase] = await db.update(sessionMinutesPurchases)
      .set({
        refundedAt: data.refundedAt,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        razorpayRefundId: data.razorpayRefundId,
        refundedBy: data.refundedBy,
        status: data.status,
      })
      .where(eq(sessionMinutesPurchases.id, id))
      .returning();
    
    return purchase;
  }
  
  async deletePayment(id: string): Promise<boolean> {
    try {
      const result = await db.delete(payments)
        .where(eq(payments.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Delete payment error:", error);
      return false;
    }
  }
  
  async deleteSessionMinutesPurchase(id: string): Promise<boolean> {
    try {
      const result = await db.delete(sessionMinutesPurchases)
        .where(eq(sessionMinutesPurchases.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Delete session minutes purchase error:", error);
      return false;
    }
  }
  
  async deleteAddonPurchase(id: string): Promise<boolean> {
    try {
      const result = await db.delete(addonPurchases)
        .where(eq(addonPurchases.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Delete addon purchase error:", error);
      return false;
    }
  }
  
  // ========================================
  // ENTERPRISE LICENSE MANAGEMENT IMPLEMENTATIONS
  // ========================================
  
  // Organization operations
  async createOrganization(data: {
    companyName: string;
    billingEmail: string;
    primaryManagerId?: string;
    razorpayCustomerId?: string;
    status?: string;
  }): Promise<Organization> {
    const [organization] = await db.insert(organizations).values({
      companyName: data.companyName,
      billingEmail: data.billingEmail,
      primaryManagerId: data.primaryManagerId,
      razorpayCustomerId: data.razorpayCustomerId,
      status: data.status || 'active',
    }).returning();
    
    return organization;
  }
  
  async getOrganizationById(id: string): Promise<Organization | null> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization || null;
  }
  
  async getOrganizationByManagerId(managerId: string): Promise<Organization | null> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.primaryManagerId, managerId));
    return organization || null;
  }
  
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const [organization] = await db.update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    
    return organization;
  }
  
  // Organization membership operations
  async createOrganizationMembership(data: {
    organizationId: string;
    userId: string;
    role: string;
    status?: string;
  }): Promise<OrganizationMembership> {
    const [membership] = await db.insert(organizationMemberships).values({
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role,
      status: data.status || 'active',
    }).returning();
    
    return membership;
  }
  
  async getOrganizationMemberships(organizationId: string): Promise<OrganizationMembership[]> {
    const memberships = await db.select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, organizationId));
    
    return memberships;
  }
  
  async getUserMembership(userId: string): Promise<OrganizationMembership | null> {
    const [membership] = await db.select()
      .from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, 'active')
      ));
    
    return membership || null;
  }
  
  async updateMembershipStatus(id: string, status: string): Promise<OrganizationMembership> {
    const [membership] = await db.update(organizationMemberships)
      .set({ 
        status,
        leftAt: status === 'inactive' ? new Date() : null
      })
      .where(eq(organizationMemberships.id, id))
      .returning();
    
    return membership;
  }
  
  async updateMembershipRole(id: string, role: string): Promise<OrganizationMembership> {
    const [membership] = await db.update(organizationMemberships)
      .set({ role })
      .where(eq(organizationMemberships.id, id))
      .returning();
    
    return membership;
  }
  
  async removeMembership(id: string): Promise<void> {
    await db.update(organizationMemberships)
      .set({ status: 'inactive', leftAt: new Date() })
      .where(eq(organizationMemberships.id, id));
  }
  
  // License package operations
  async createLicensePackage(data: {
    organizationId: string;
    packageType: string;
    totalSeats: number;
    pricePerSeat: string;
    totalAmount: string;
    currency: string;
    startDate: Date;
    endDate: Date;
    previousPackageId?: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    status?: string;
  }): Promise<LicensePackage> {
    const [licensePackage] = await db.insert(licensePackages).values({
      organizationId: data.organizationId,
      packageType: data.packageType,
      totalSeats: data.totalSeats,
      pricePerSeat: data.pricePerSeat,
      totalAmount: data.totalAmount,
      currency: data.currency,
      startDate: data.startDate,
      endDate: data.endDate,
      previousPackageId: data.previousPackageId,
      razorpaySubscriptionId: data.razorpaySubscriptionId,
      razorpayOrderId: data.razorpayOrderId,
      status: data.status || 'active',
    }).returning();
    
    return licensePackage;
  }
  
  async getLicensePackageById(id: string): Promise<LicensePackage | null> {
    const [pkg] = await db.select().from(licensePackages).where(eq(licensePackages.id, id));
    return pkg || null;
  }
  
  async getOrganizationLicensePackages(organizationId: string): Promise<LicensePackage[]> {
    const packages = await db.select()
      .from(licensePackages)
      .where(eq(licensePackages.organizationId, organizationId))
      .orderBy(desc(licensePackages.createdAt));
    
    return packages;
  }
  
  async getActiveLicensePackage(organizationId: string): Promise<LicensePackage | null> {
    const [pkg] = await db.select()
      .from(licensePackages)
      .where(and(
        eq(licensePackages.organizationId, organizationId),
        eq(licensePackages.status, 'active'),
        gte(licensePackages.endDate, new Date())
      ))
      .orderBy(desc(licensePackages.createdAt))
      .limit(1);
    
    return pkg || null;
  }
  
  async updateLicensePackage(id: string, data: Partial<LicensePackage>): Promise<LicensePackage> {
    const [pkg] = await db.update(licensePackages)
      .set(data)
      .where(eq(licensePackages.id, id))
      .returning();
    
    return pkg;
  }
  
  async incrementPackageSeats(packageId: string, additionalSeats: number): Promise<LicensePackage> {
    const pkg = await this.getLicensePackageById(packageId);
    if (!pkg) {
      throw new Error('License package not found');
    }
    
    const newTotalSeats = pkg.totalSeats + additionalSeats;
    const pricePerSeat = parseFloat(pkg.pricePerSeat);
    const newTotalAmount = (newTotalSeats * pricePerSeat).toString();
    
    const [updated] = await db.update(licensePackages)
      .set({ 
        totalSeats: newTotalSeats,
        totalAmount: newTotalAmount
      })
      .where(eq(licensePackages.id, packageId))
      .returning();
    
    return updated;
  }
  
  async updateLicensePackageAutoRenew(packageId: string, autoRenew: boolean): Promise<LicensePackage> {
    const pkg = await this.getLicensePackageById(packageId);
    if (!pkg) {
      throw new Error('License package not found');
    }
    return pkg;
  }
  
  async getOrganizationAddons(organizationId: string): Promise<EnhancedAddonDTO[]> {
    const purchases = await db.select({
      id: addonPurchases.id,
      addonType: addonPurchases.addonType,
      packageSku: addonPurchases.packageSku,
      status: addonPurchases.status,
      startDate: addonPurchases.startDate,
      endDate: addonPurchases.endDate,
      totalUnits: addonPurchases.totalUnits,
      usedUnits: addonPurchases.usedUnits,
      purchaseAmount: addonPurchases.purchaseAmount,
      currency: addonPurchases.currency,
      autoRenew: addonPurchases.autoRenew,
      billingType: addonPurchases.billingType,
      metadata: addonPurchases.metadata,
    })
      .from(addonPurchases)
      .where(eq(addonPurchases.organizationId, organizationId));
    
    return purchases.map(p => ({
      id: p.id,
      addonId: null,
      slug: p.packageSku,
      displayName: p.packageSku,
      type: p.addonType,
      billingType: p.billingType,
      status: p.status,
      startDate: p.startDate?.toISOString() || null,
      renewalDate: p.endDate?.toISOString() || null,
      endDate: p.endDate?.toISOString() || null,
      totalUnits: p.totalUnits || 0,
      usedUnits: p.usedUnits || 0,
      pricePerUnit: null,
      totalPrice: p.purchaseAmount,
      currency: p.currency || 'USD',
      autoRenew: p.autoRenew ?? false,
      purchaseId: p.id,
      metadata: (p.metadata as Record<string, any>) || null,
    }));
  }
  
  // License assignment operations
  async createLicenseAssignment(data: {
    licensePackageId: string;
    userId: string;
    assignedBy?: string;
    notes?: string;
    status?: string;
  }): Promise<LicenseAssignment> {
    // Check if user already has an active assignment for this package
    const [existing] = await db.select()
      .from(licenseAssignments)
      .where(and(
        eq(licenseAssignments.licensePackageId, data.licensePackageId),
        eq(licenseAssignments.userId, data.userId),
        eq(licenseAssignments.status, 'active')
      ));
    
    if (existing) {
      throw new Error('User already has an active license assignment for this package');
    }
    
    // Check available seats
    const availableSeats = await this.getAvailableSeats(data.licensePackageId);
    if (availableSeats <= 0) {
      throw new Error('No available seats in this license package');
    }
    
    const [assignment] = await db.insert(licenseAssignments).values({
      licensePackageId: data.licensePackageId,
      userId: data.userId,
      assignedBy: data.assignedBy,
      notes: data.notes,
      status: data.status || 'active',
    }).returning();
    
    return assignment;
  }
  
  async getLicenseAssignmentsByPackage(packageId: string): Promise<LicenseAssignment[]> {
    const assignments = await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.licensePackageId, packageId))
      .orderBy(desc(licenseAssignments.assignedAt));
    
    return assignments;
  }
  
  async getUserActiveLicenseAssignment(userId: string): Promise<LicenseAssignment | null> {
    const [assignment] = await db.select()
      .from(licenseAssignments)
      .where(and(
        eq(licenseAssignments.userId, userId),
        eq(licenseAssignments.status, 'active')
      ))
      .limit(1);
    
    return assignment || null;
  }
  
  async getAvailableSeats(packageId: string): Promise<number> {
    const pkg = await this.getLicensePackageById(packageId);
    if (!pkg) {
      return 0;
    }
    
    const [result] = await db.select({
      assignedCount: sql<number>`count(*)::int`
    })
      .from(licenseAssignments)
      .where(and(
        eq(licenseAssignments.licensePackageId, packageId),
        eq(licenseAssignments.status, 'active')
      ));
    
    const assignedSeats = result?.assignedCount || 0;
    return pkg.totalSeats - assignedSeats;
  }
  
  async reassignLicense(
    assignmentId: string, 
    newUserId: string, 
    assignedBy: string, 
    notes?: string
  ): Promise<LicenseAssignment> {
    // Get the current assignment
    const [currentAssignment] = await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.id, assignmentId));
    
    if (!currentAssignment) {
      throw new Error('License assignment not found');
    }
    
    // Unassign from current user
    await db.update(licenseAssignments)
      .set({ 
        status: 'inactive',
        unassignedAt: new Date()
      })
      .where(eq(licenseAssignments.id, assignmentId));
    
    // Create new assignment for new user
    const newAssignment = await this.createLicenseAssignment({
      licensePackageId: currentAssignment.licensePackageId,
      userId: newUserId,
      assignedBy,
      notes: notes || `Reassigned from previous user`,
      status: 'active'
    });
    
    return newAssignment;
  }
  
  async unassignLicense(assignmentId: string): Promise<void> {
    await db.update(licenseAssignments)
      .set({ 
        status: 'inactive',
        unassignedAt: new Date()
      })
      .where(eq(licenseAssignments.id, assignmentId));
  }
  
  async getLicenseAssignmentById(assignmentId: string): Promise<LicenseAssignment | null> {
    const [assignment] = await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.id, assignmentId));
    
    return assignment || null;
  }
  
  // Billing adjustment operations
  async createBillingAdjustment(data: {
    organizationId: string;
    licensePackageId?: string;
    adjustmentType: string;
    deltaSeats: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount: string;
    currency: string;
    status?: string;
    addedBy?: string;
  }): Promise<BillingAdjustment> {
    const [adjustment] = await db.insert(billingAdjustments).values({
      organizationId: data.organizationId,
      licensePackageId: data.licensePackageId,
      adjustmentType: data.adjustmentType,
      deltaSeats: data.deltaSeats,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      amount: data.amount,
      currency: data.currency,
      status: data.status || 'pending',
      addedBy: data.addedBy,
    }).returning();
    
    return adjustment;
  }
  
  async getOrganizationBillingAdjustments(organizationId: string): Promise<BillingAdjustment[]> {
    const adjustments = await db.select()
      .from(billingAdjustments)
      .where(eq(billingAdjustments.organizationId, organizationId))
      .orderBy(desc(billingAdjustments.createdAt));
    
    return adjustments;
  }
  
  async updateBillingAdjustment(id: string, data: Partial<BillingAdjustment>): Promise<BillingAdjustment> {
    const [adjustment] = await db.update(billingAdjustments)
      .set(data)
      .where(eq(billingAdjustments.id, id))
      .returning();
    
    return adjustment;
  }
  
  // Get admin organization detail with users list
  async getAdminOrganizationDetail(organizationId: string): Promise<AdminOrganizationDetailDTO> {
    // Get base overview
    const overview = await this.getOrganizationOverview(organizationId);
    
    // Get license manager details
    let licenseManager: LicenseManagerDTO | null = null;
    if (overview.organization.primaryManagerId) {
      const manager = await this.getUserById(overview.organization.primaryManagerId);
      if (manager) {
        licenseManager = {
          id: manager.id,
          email: manager.email,
          firstName: manager.firstName,
          lastName: manager.lastName,
          mobile: manager.mobile,
          organization: manager.organization,
          status: manager.status,
          role: manager.role,
          emailVerified: manager.emailVerified || false,
          createdAt: manager.createdAt ? new Date(manager.createdAt).toISOString() : null,
          updatedAt: manager.updatedAt ? new Date(manager.updatedAt).toISOString() : null
        };
      }
    }
    
    // Build users list from assignments and memberships
    // Get all unique user IDs from both assignments and memberships
    const userIds = new Set<string>();
    overview.assignments.forEach(a => userIds.add(a.userId));
    overview.members.forEach(m => userIds.add(m.userId));
    
    // Get full user details for all users
    const usersMap = new Map<string, OrganizationUserDTO>();
    
    const userIdsArray = Array.from(userIds);
    for (const userId of userIdsArray) {
      const user = await this.getUserById(userId);
      if (!user) continue;
      
      // Find assignment for this user
      const assignment = overview.assignments.find(a => a.userId === userId && a.status === 'active');
      
      // Find membership for this user
      const membership = overview.members.find(m => m.userId === userId);
      
      // Get addon status (train me and DAI)
      const addons = await this.getOrganizationAddons(organizationId);
      const userAddons = addons.filter(a => {
        // Check if user has access to addons (simplified - in real system, check user-specific addon assignments)
        return a.status === 'active';
      });
      
      const trainMeEnabled = userAddons.some(a => a.slug === 'train_me' || a.type === 'train_me');
      const daiEnabled = userAddons.some(a => a.slug === 'dai' || a.type === 'dai');
      
      usersMap.set(userId, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        organization: user.organization,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified || false,
        licenseStatus: assignment ? 'assigned' : 'none',
        assignmentId: assignment?.id || null,
        assignedAt: assignment?.assignedAt || null,
        revokedAt: assignment?.revokedAt || null,
        lastActive: null, // TODO: Get from user activity tracking
        trainMeEnabled,
        daiEnabled
      });
    }
    
    const users = Array.from(usersMap.values());
    
    // Get billing history from billing adjustments
    const billingAdjustments = await this.getOrganizationBillingAdjustments(organizationId);
    const billingHistory = billingAdjustments.map(adj => ({
      id: adj.id,
      amount: adj.amount,
      currency: adj.currency,
      status: adj.status,
      description: adj.adjustmentType === 'admin_seat_addition' 
        ? `Admin added ${adj.deltaSeats} seat(s)`
        : adj.adjustmentType === 'initial_purchase'
        ? `Initial license purchase`
        : adj.adjustmentType === 'seat_addition'
        ? `Added ${adj.deltaSeats} seat(s)`
        : `Billing adjustment: ${adj.adjustmentType}`,
      createdAt: adj.createdAt ? new Date(adj.createdAt).toISOString() : null
    }));
    
    // Build enhanced license package DTO
    let licensePackage: EnhancedLicensePackageDTO | null = null;
    if (overview.activePackage) {
      const pkg = await this.getLicensePackageById(overview.activePackage.id);
      if (pkg) {
        licensePackage = {
          id: pkg.id,
          packageType: pkg.packageType,
          totalSeats: pkg.totalSeats,
          assignedSeats: overview.assignedSeats,
          availableSeats: overview.availableSeats,
          status: pkg.status,
          startDate: pkg.startDate.toISOString(),
          endDate: pkg.endDate.toISOString(),
          renewalDate: null, // TODO: Calculate renewal date
          autoRenew: false, // TODO: Implement auto-renew tracking
          pricePerSeat: pkg.pricePerSeat,
          currency: pkg.currency || 'USD'
        };
      }
    }
    
    // Get addons directly using getOrganizationAddons which returns EnhancedAddonDTO[]
    const enhancedAddons = await this.getOrganizationAddons(organizationId);
    
    return {
      organization: overview.organization,
      licenseManager,
      licensePackage,
      addons: enhancedAddons,
      users,
      assignments: overview.assignments,
      members: overview.members,
      billingHistory,
      totalSeats: overview.totalSeats,
      assignedSeats: overview.assignedSeats,
      availableSeats: overview.availableSeats
    };
  }
  
  // Enterprise dashboard operations
  async getOrganizationOverview(organizationId: string): Promise<OrganizationOverviewDTO> {
    // Get organization
    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    // Get active license package
    const activePackage = await this.getActiveLicensePackage(organizationId);
    
    // Get organization owner's subscription details with proper DTO
    let subscriptionDTO: OrganizationSubscriptionDTO | null = null;
    const addonsDTO: OrganizationAddonDTO[] = [];
    
    if (organization.primaryManagerId) {
      // Get owner's subscription (platform access)
      const [ownerSubscription] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, organization.primaryManagerId))
        .limit(1);
      
      if (ownerSubscription && ownerSubscription.planId) {
        // Get subscription plan details
        const [plan] = await db.select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, ownerSubscription.planId))
          .limit(1);
        
        // Create properly typed DTO with ISO string dates (return null for missing createdAt)
        subscriptionDTO = {
          id: ownerSubscription.id,
          planId: ownerSubscription.planId,
          plan: plan ? {
            id: plan.id,
            name: plan.name,
            billingInterval: plan.billingInterval,
            price: plan.price
          } : null,
          status: ownerSubscription.status,
          createdAt: ownerSubscription.createdAt ? new Date(ownerSubscription.createdAt).toISOString() : null,
          currentPeriodStart: ownerSubscription.currentPeriodStart ? new Date(ownerSubscription.currentPeriodStart).toISOString() : null,
          currentPeriodEnd: ownerSubscription.currentPeriodEnd ? new Date(ownerSubscription.currentPeriodEnd).toISOString() : null,
        };
      }
    }
    
    // Get members with user details
    const membershipsData = await db.select({
      membership: organizationMemberships,
      user: authUsers
    })
      .from(organizationMemberships)
      .innerJoin(authUsers, eq(organizationMemberships.userId, authUsers.id))
      .where(eq(organizationMemberships.organizationId, organizationId));
    
    const membersDTO: OrganizationMembershipDTO[] = membershipsData.map(row => ({
      id: row.membership.id,
      organizationId: row.membership.organizationId,
      userId: row.membership.userId,
      role: row.membership.role,
      status: row.membership.status,
      joinedAt: row.membership.joinedAt ? new Date(row.membership.joinedAt).toISOString() : null,
      leftAt: row.membership.leftAt ? new Date(row.membership.leftAt).toISOString() : null,
      user: {
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName
      }
    }));
    
    // Get assignments with user details if there's an active package
    let assignmentsDTO: LicenseAssignmentDTO[] = [];
    let totalSeats = 0;
    let assignedSeats = 0;
    let availableSeats = 0;
    
    if (activePackage) {
      const assignmentsData = await db.select({
        assignment: licenseAssignments,
        user: authUsers
      })
        .from(licenseAssignments)
        .innerJoin(authUsers, eq(licenseAssignments.userId, authUsers.id))
        .where(eq(licenseAssignments.licensePackageId, activePackage.id));
      
      assignmentsDTO = assignmentsData.map(row => ({
        id: row.assignment.id,
        licensePackageId: row.assignment.licensePackageId,
        userId: row.assignment.userId,
        assignedAt: row.assignment.assignedAt ? new Date(row.assignment.assignedAt).toISOString() : null,
        revokedAt: row.assignment.unassignedAt ? new Date(row.assignment.unassignedAt).toISOString() : null,
        status: row.assignment.status,
        notes: row.assignment.notes,
        user: {
          id: row.user.id,
          email: row.user.email,
          firstName: row.user.firstName,
          lastName: row.user.lastName
        }
      }));
      
      totalSeats = activePackage.totalSeats;
      assignedSeats = assignmentsDTO.filter(a => a.status === 'active').length;
      availableSeats = totalSeats - assignedSeats;
    }
    
    // Map organization to DTO
    const organizationDTO: OrganizationDTO = {
      id: organization.id,
      companyName: organization.companyName,
      billingEmail: organization.billingEmail,
      primaryManagerId: organization.primaryManagerId,
      razorpayCustomerId: organization.razorpayCustomerId,
      status: organization.status,
      createdAt: organization.createdAt ? new Date(organization.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: organization.updatedAt ? new Date(organization.updatedAt).toISOString() : new Date().toISOString(),
    };
    
    return {
      organization: organizationDTO,
      activePackage: activePackage ? {
        id: activePackage.id,
        packageType: activePackage.packageType,
        totalSeats: activePackage.totalSeats,
        startDate: activePackage.startDate.toISOString(),
        endDate: activePackage.endDate.toISOString(),
        status: activePackage.status
      } : null,
      totalSeats,
      assignedSeats,
      availableSeats,
      members: membersDTO,
      assignments: assignmentsDTO,
      subscription: subscriptionDTO,
      addons: addonsDTO
    };
  }
  
  // License manager authorization
  async isLicenseManager(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    // Check if user has license_manager role
    if (user.role === 'license_manager') {
      return true;
    }
    
    // Check if user is a license manager in any organization
    const [membership] = await db.select()
      .from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.role, 'license_manager'),
        eq(organizationMemberships.status, 'active')
      ))
      .limit(1);
    
    return !!membership;
  }
  
  async canManageLicenses(userId: string, organizationId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    // Admins can manage any organization
    if (user.role === 'admin') {
      return true;
    }
    
    // Check if user is a license manager for this specific organization
    const [membership] = await db.select()
      .from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.role, 'license_manager'),
        eq(organizationMemberships.status, 'active')
      ))
      .limit(1);
    
    return !!membership;
  }
  
  async deactivateEnterpriseUser(userId: string, revokedBy: string, organizationId: string): Promise<void> {
    // Use database transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // 1. Suspend user account and increment sessionVersion to invalidate existing JWTs
      await tx.update(authUsers)
        .set({ 
          status: 'suspended',
          sessionVersion: sql`${authUsers.sessionVersion} + 1`,
          updatedAt: new Date()
        })
        .where(eq(authUsers.id, userId));
      
      // 2. Mark organization membership as inactive
      await tx.update(organizationMemberships)
        .set({ 
          status: 'inactive',
          leftAt: new Date()
        })
        .where(and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId)
        ));
      
      // 3. Revoke license assignments ONLY for packages belonging to this organization
      // Get organization's license packages first
      const orgPackages = await tx.select({ id: licensePackages.id })
        .from(licensePackages)
        .where(eq(licensePackages.organizationId, organizationId));
      
      const packageIds = orgPackages.map(p => p.id);
      
      if (packageIds.length > 0) {
        // Import inArray from drizzle-orm
        const { inArray } = await import('drizzle-orm');
        
        // Revoke assignments only for this organization's packages
        await tx.update(licenseAssignments)
          .set({ 
            status: 'revoked',
            unassignedAt: new Date()
          })
          .where(and(
            eq(licenseAssignments.userId, userId),
            eq(licenseAssignments.status, 'active'),
            inArray(licenseAssignments.licensePackageId, packageIds)
          ));
      }
      
      // 4. Invalidate all refresh tokens to force logout
      await tx.delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
      
      // 5. Create audit log
      await tx.insert(auditLogs).values({
        actorId: revokedBy,
        action: 'USER_DEACTIVATED',
        targetType: 'user',
        targetId: userId,
        metadata: {
          organizationId,
          reason: 'License manager removed user from organization',
          revokedPackageIds: packageIds,
          timestamp: new Date().toISOString()
        }
      });
    });
  }
  
  async createConversationMemory(memory: InsertConversationMemory): Promise<ConversationMemory> {
    const [result] = await db.insert(conversationMemories).values(memory).returning();
    return result;
  }
  
  async getConversationMemory(conversationId: string): Promise<ConversationMemory | null> {
    const [memory] = await db.select()
      .from(conversationMemories)
      .where(eq(conversationMemories.conversationId, conversationId))
      .limit(1);
    return memory || null;
  }
  
  async updateConversationMemory(conversationId: string, updates: Partial<ConversationMemory>): Promise<ConversationMemory | null> {
    const [updated] = await db.update(conversationMemories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationMemories.conversationId, conversationId))
      .returning();
    return updated || null;
  }
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const [profile] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return profile || null;
  }
  
  async upsertUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile> {
    const existing = await this.getUserProfile(profile.userId);
    
    if (existing) {
      const [updated] = await db.update(userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(userProfiles.userId, profile.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProfiles).values(profile).returning();
      return created;
    }
  }
  
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const [updated] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated || null;
  }
  
  async getAllOrganizations(options?: { 
    search?: string; 
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminOrganizationListItemDTO[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let baseQuery = db.select({
      org: organizations,
      manager: authUsers,
      pkg: licensePackages
    })
      .from(organizations)
      .leftJoin(authUsers, eq(organizations.primaryManagerId, authUsers.id))
      .leftJoin(licensePackages, and(
        eq(licensePackages.organizationId, organizations.id),
        eq(licensePackages.status, 'active')
      ));
    
    const conditions: any[] = [];
    
    if (options?.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${organizations.companyName}) LIKE ${searchTerm}`,
          sql`LOWER(${organizations.billingEmail}) LIKE ${searchTerm}`,
          sql`LOWER(${authUsers.email}) LIKE ${searchTerm}`,
          sql`LOWER(CONCAT(${authUsers.firstName}, ' ', ${authUsers.lastName})) LIKE ${searchTerm}`
        )
      );
    }
    
    if (options?.status && options.status !== 'all') {
      conditions.push(eq(organizations.status, options.status));
    }
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }
    
    const results = await baseQuery
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get assignment counts for each organization
    const orgResults: AdminOrganizationListItemDTO[] = [];
    
    for (const row of results) {
      let assignedSeats = 0;
      let totalSeats = row.pkg?.totalSeats || 0;
      
      if (row.pkg) {
        const assignments = await db.select()
          .from(licenseAssignments)
          .where(and(
            eq(licenseAssignments.licensePackageId, row.pkg.id),
            eq(licenseAssignments.status, 'active')
          ));
        assignedSeats = assignments.length;
      }
      
      orgResults.push({
        id: row.org.id,
        companyName: row.org.companyName,
        billingEmail: row.org.billingEmail,
        status: row.org.status,
        createdAt: row.org.createdAt ? new Date(row.org.createdAt).toISOString() : null,
        totalSeats,
        assignedSeats,
        availableSeats: totalSeats - assignedSeats,
        activePackageType: row.pkg?.packageType || null,
        packageEndDate: row.pkg?.endDate ? new Date(row.pkg.endDate).toISOString() : null,
        licenseManagerName: row.manager ? `${row.manager.firstName} ${row.manager.lastName}` : null,
        licenseManagerEmail: row.manager?.email || null
      });
    }
    
    return orgResults;
  }
  
  async getOrganizationsCount(options?: { 
    search?: string; 
    status?: string;
  }): Promise<number> {
    let baseQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(organizations)
      .leftJoin(authUsers, eq(organizations.primaryManagerId, authUsers.id));
    
    const conditions: any[] = [];
    
    if (options?.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${organizations.companyName}) LIKE ${searchTerm}`,
          sql`LOWER(${organizations.billingEmail}) LIKE ${searchTerm}`,
          sql`LOWER(${authUsers.email}) LIKE ${searchTerm}`
        )
      );
    }
    
    if (options?.status && options.status !== 'all') {
      conditions.push(eq(organizations.status, options.status));
    }
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }
    
    const [result] = await baseQuery;
    return Number(result?.count || 0);
  }
  
  // ========================================
  // AI TOKEN USAGE TRACKING IMPLEMENTATIONS
  // ========================================
  
  async recordAITokenUsage(data: {
    userId: string;
    organizationId?: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestId?: string;
    feature?: string;
    metadata?: any;
    occurredAt?: Date;
  }): Promise<AITokenUsage> {
    const [usage] = await db.insert(aiTokenUsage).values({
      userId: data.userId,
      organizationId: data.organizationId || null,
      provider: data.provider,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      requestId: data.requestId || null,
      feature: data.feature || null,
      metadata: data.metadata || {},
      occurredAt: data.occurredAt || new Date(),
    }).returning();
    return usage;
  }
  
  async getAITokenUsage(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    provider?: string;
    limit?: number;
    offset?: number;
  }): Promise<AITokenUsage[]> {
    const conditions: any[] = [eq(aiTokenUsage.userId, userId)];
    
    if (options?.startDate) {
      conditions.push(gte(aiTokenUsage.occurredAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(aiTokenUsage.occurredAt, options.endDate));
    }
    if (options?.provider) {
      conditions.push(eq(aiTokenUsage.provider, options.provider));
    }
    
    const query = db.select()
      .from(aiTokenUsage)
      .where(and(...conditions))
      .orderBy(desc(aiTokenUsage.occurredAt))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);
    
    return await query;
  }
  
  async getAITokenUsageSummary(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{
    provider: string;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    requestCount: number;
  }>> {
    const conditions: any[] = [eq(aiTokenUsage.userId, userId)];
    
    if (options?.startDate) {
      conditions.push(gte(aiTokenUsage.occurredAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(aiTokenUsage.occurredAt, options.endDate));
    }
    
    const results = await db.select({
      provider: aiTokenUsage.provider,
      totalPromptTokens: sql<number>`COALESCE(SUM(${aiTokenUsage.promptTokens}), 0)::integer`,
      totalCompletionTokens: sql<number>`COALESCE(SUM(${aiTokenUsage.completionTokens}), 0)::integer`,
      totalTokens: sql<number>`COALESCE(SUM(${aiTokenUsage.totalTokens}), 0)::integer`,
      requestCount: sql<number>`COUNT(*)::integer`,
    })
      .from(aiTokenUsage)
      .where(and(...conditions))
      .groupBy(aiTokenUsage.provider);
    
    return results;
  }
  
  // ========================================
  // TERMS AND CONDITIONS MANAGEMENT
  // ========================================
  
  async getActiveTermsAndConditions(): Promise<import("@shared/schema").TermsAndConditions | null> {
    const [result] = await db.select()
      .from(termsAndConditions)
      .where(eq(termsAndConditions.isActive, true))
      .orderBy(desc(termsAndConditions.updatedAt))
      .limit(1);
    return result || null;
  }
  
  async getAllTermsVersions(): Promise<import("@shared/schema").TermsAndConditions[]> {
    return await db.select()
      .from(termsAndConditions)
      .orderBy(desc(termsAndConditions.updatedAt));
  }
  
  async createTermsAndConditions(data: {
    title: string;
    content: string;
    version: string;
    lastModifiedBy: string;
  }): Promise<import("@shared/schema").TermsAndConditions> {
    // Deactivate all existing terms first
    await db.update(termsAndConditions)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Create new active terms
    const [newTerms] = await db.insert(termsAndConditions)
      .values({
        title: data.title,
        content: data.content,
        version: data.version,
        lastModifiedBy: data.lastModifiedBy,
        isActive: true,
      })
      .returning();
    
    return newTerms;
  }
  
  async updateTermsAndConditions(id: string, data: {
    title?: string;
    content?: string;
    version?: string;
    lastModifiedBy: string;
  }): Promise<import("@shared/schema").TermsAndConditions> {
    const [updated] = await db.update(termsAndConditions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(termsAndConditions.id, id))
      .returning();
    
    return updated;
  }
  
  async setActiveTerms(id: string): Promise<void> {
    // Deactivate all terms first
    await db.update(termsAndConditions)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Activate the selected terms
    await db.update(termsAndConditions)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(termsAndConditions.id, id));
  }
}

export const authStorage = new AuthStorage();
