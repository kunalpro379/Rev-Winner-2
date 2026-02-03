import { db } from "../db";
import { 
  subscriptions, 
  payments, 
  sessionMinutesPurchases,
  licensePackages,
  licenseAssignments,
  organizationMemberships,
  organizations,
  auditLogs,
  authUsers,
  billingAdjustments,
  pendingOrders,
  subscriptionPlans
} from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

// Email helper function
const GMAIL_USER = process.env.GMAIL_USER || 'revwinner2025@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

let transporter: nodemailer.Transporter | null = null;

if (GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.warn('Gmail SMTP not configured. Email not sent to:', to);
    return;
  }
  
  await transporter.sendMail({
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Subscription Lifecycle Service
 * 
 * Handles the complete lifecycle of subscriptions and licenses:
 * - Payment confirmation and verification
 * - Plan activation for individual subscribers
 * - License provisioning for enterprise customers
 * - Entitlement updates and usage tracking
 * - Automated email notifications
 */

export interface PaymentConfirmation {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  amount: number;
  currency: string;
}

export interface ActivationResult {
  success: boolean;
  subscriptionId?: string;
  licensePackageId?: string;
  message: string;
  entitlements?: {
    sessionsLimit?: string;
    minutesLimit?: string;
    seatsTotal?: number;
  };
}

/**
 * Activate an individual subscription after payment confirmation
 */
export async function activateIndividualSubscription(
  userId: string,
  planId: string,
  payment: PaymentConfirmation
): Promise<ActivationResult> {
  // CRITICAL: Wrap entire activation in database transaction for atomicity
  return await db.transaction(async (tx) => {
    try {
      console.log(`🎯 Activating individual subscription for user ${userId}, plan ${planId}`);
      
      // Get the pending order
      const [pendingOrder] = await tx
        .select()
        .from(pendingOrders)
        .where(
          and(
            eq(pendingOrders.userId, userId),
            eq(pendingOrders.gatewayOrderId, payment.razorpayOrderId),
            eq(pendingOrders.status, "pending")
          )
        );

      if (!pendingOrder) {
        throw new Error("Pending order not found or already processed");
      }

      // Parse the order items to determine plan type and limits
      // DEFENSIVE: Handle legacy/manual orders with missing metadata
      const orderData = (pendingOrder.metadata as any) || {};
      let mainPlan = orderData.items?.find((item: any) => item.type === "platform_subscription");
      
      if (!mainPlan) {
        // FALLBACK: For legacy/manual orders, fetch plan details directly
        console.warn(`⚠️ Missing metadata.items for order ${pendingOrder.gatewayOrderId}, fetching plan from database`);
        const [plan] = await tx.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
        if (!plan) {
          throw new Error("No platform subscription found in order and planId lookup failed");
        }
        // Alert ops team about data anomaly
        console.error(`🚨 ANOMALY: Pending order ${pendingOrder.id} missing metadata.items - manual intervention may be needed`);
        
        // Construct mainPlan object from database plan
        mainPlan = {
          type: 'platform_subscription',
          name: plan.name,
          slug: plan.billingInterval, // Use billingInterval as slug fallback
          price: parseFloat(plan.price)
        };
      }

      // Determine subscription type and limits based on plan
      let planType: string;
      let sessionsLimit: string | null = null;
      let minutesLimit: string | null = null;
      let currentPeriodEnd: Date;

      // Fetch the actual plan from database to get accurate billingInterval
      const [planFromDb] = await tx.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      
      if (!planFromDb) {
        throw new Error(`Plan ${planId} not found in database`);
      }

      // Determine planType from billingInterval (authoritative source)
      const billingInterval = planFromDb.billingInterval;
      
      if (billingInterval === '3-years' || billingInterval === '36-months') {
        planType = "three_year";
        currentPeriodEnd = new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000); // 3 years
      } else if (billingInterval === '1-year' || billingInterval === 'yearly' || billingInterval === '12-months') {
        planType = "yearly";
        currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      } else if (billingInterval === '6-months') {
        planType = "six_month";
        currentPeriodEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
      } else if (billingInterval === 'monthly' || billingInterval === 'month-to-month' || billingInterval === '1-month') {
        planType = "monthly";
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else {
        // Fallback: try to parse from plan slug/name
        const planSlug = mainPlan.slug || mainPlan.name?.toLowerCase().replace(/\s+/g, "-");
        
        if (planSlug?.includes("36-months") || planSlug?.includes("3-year")) {
          planType = "three_year";
          currentPeriodEnd = new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000);
        } else if (planSlug?.includes("12-months") || planSlug?.includes("1-year") || planSlug?.includes("yearly")) {
          planType = "yearly";
          currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else if (planSlug?.includes("6-months")) {
          planType = "six_month";
          currentPeriodEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        } else if (planSlug?.includes("month-to-month") || planSlug?.includes("monthly")) {
          planType = "monthly";
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else {
          planType = "custom";
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
        }
      }
      
      console.log(`📋 Plan type determined: ${planType} (from billingInterval: ${billingInterval})`);

      // Create planSlug for metadata logging
      const planSlug = planFromDb.billingInterval;

      // Create or update subscription
      const [existingSubscription] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      let subscription;
      
      if (existingSubscription) {
        // Update existing subscription
        [subscription] = await tx
          .update(subscriptions)
          .set({
            planId,
            planType,
            status: "active",
            sessionsLimit,
            minutesLimit,
            currentPeriodStart: new Date(),
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSubscription.id))
          .returning();
      } else {
        // Create new subscription
        [subscription] = await tx
          .insert(subscriptions)
          .values({
            userId,
            planId,
            planType,
            status: "active",
            sessionsUsed: "0",
            minutesUsed: "0",
            sessionsLimit,
            minutesLimit,
            sessionHistory: [],
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          })
          .returning();
      }

      // Get user's organization ID to record customer type at transaction time
      // Query directly within transaction
      const orgResult = await tx.select({
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
      
      const organizationId = orgResult.length > 0 ? orgResult[0].organizationId : null;
      
      // Record the payment
      await tx.insert(payments).values({
        userId,
        organizationId,
        subscriptionId: subscription.id,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: "succeeded",
        metadata: { planSlug, planType },
      });

      // Process add-ons (session minutes, training, DAI)
      const addons = orderData.items?.filter((item: any) => 
        item.type === "session_minutes" || item.type === "training" || item.type === "dai_service"
      );

      if (addons && addons.length > 0) {
        for (const addon of addons) {
          if (addon.type === "session_minutes") {
            // Extract minutes from addon name or slug
            const minutesMatch = addon.name?.match(/(\d+)\s*minutes?/i) || addon.slug?.match(/(\d+)/);
            const minutesPurchased = minutesMatch ? parseInt(minutesMatch[1]) : 500;

            await tx.insert(sessionMinutesPurchases).values({
              userId,
              organizationId, // Record customer type
              minutesPurchased,
              minutesUsed: 0,
              minutesRemaining: minutesPurchased,
              purchaseDate: new Date(),
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              status: "active",
              razorpayOrderId: payment.razorpayOrderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              amountPaid: addon.price?.toString() || "0",
              currency: payment.currency,
            });
          }
          // Add handlers for training and DAI services here if needed
        }
      }

      // Update pending order status
      await tx
        .update(pendingOrders)
        .set({ 
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(pendingOrders.id, pendingOrder.id));

      // Create audit log
      await tx.insert(auditLogs).values({
        actorId: userId,
        action: "subscription.activated",
        targetType: "subscription",
        targetId: subscription.id,
        metadata: { planId, planType, orderId: payment.razorpayOrderId },
      });

      // Send confirmation email (outside transaction - not critical for atomicity)
      const [user] = await tx.select().from(authUsers).where(eq(authUsers.id, userId));
      if (user?.email) {
        // Fire and forget email - don't fail transaction if email fails
        sendSubscriptionActivationEmail(user.email, {
          planName: mainPlan.name || "Platform Access",
          planType,
          expiryDate: currentPeriodEnd,
        }).catch(err => console.error("Email send failed:", err));
      }

      console.log(`Subscription activated successfully: ${subscription.id}`);

      return {
        success: true,
        subscriptionId: subscription.id,
        message: "Subscription activated successfully",
        entitlements: {
          sessionsLimit: sessionsLimit || "unlimited",
          minutesLimit: minutesLimit || "unlimited",
        },
      };
    } catch (error: any) {
      console.error("❌ Error activating individual subscription:", error);
      // Transaction will auto-rollback on error
      throw error; // Re-throw to trigger rollback
    }
  }).catch((error: any) => {
    // Handle transaction rollback
    console.error("❌ Transaction rolled back:", error);
    return {
      success: false,
      message: `Subscription activation failed: ${error.message}`,
    };
  });
}

/**
 * Activate enterprise license package after payment confirmation
 */
export async function activateEnterpriseLicense(
  organizationId: string,
  packageType: string,
  totalSeats: number,
  payment: PaymentConfirmation,
  purchasedBy: string
): Promise<ActivationResult> {
  return await db.transaction(async (tx) => {
    try {
      console.log(`🏢 Activating enterprise license for org ${organizationId}, ${totalSeats} seats`);

      // IDEMPOTENCY CHECK: Prevent duplicate activation on webhook retries
      const existingPackage = await tx
        .select()
        .from(licensePackages)
        .where(eq(licensePackages.razorpayOrderId, payment.razorpayOrderId))
        .limit(1);

      if (existingPackage.length > 0) {
        console.log(`⚠️ License package already exists for order ${payment.razorpayOrderId}, skipping duplicate activation`);
        return {
          success: true,
          licensePackageId: existingPackage[0].id,
          message: "License package already activated (idempotent)",
          entitlements: { seatsTotal: existingPackage[0].totalSeats },
        };
      }

      let durationMonths: number;
      if (packageType.includes("1-year")) {
        durationMonths = 12;
      } else if (packageType.includes("3-year")) {
        durationMonths = 36;
      } else {
        durationMonths = 12;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
      const pricePerSeat = (payment.amount / totalSeats).toFixed(2);

      const [licensePackage] = await tx
        .insert(licensePackages)
        .values({
          organizationId,
          packageType,
          totalSeats,
          pricePerSeat,
          totalAmount: payment.amount.toString(),
          currency: payment.currency,
          startDate,
          endDate,
          razorpayOrderId: payment.razorpayOrderId,
          status: "active",
        })
        .returning();

      await tx.insert(billingAdjustments).values({
        organizationId,
        licensePackageId: licensePackage.id,
        adjustmentType: "initial_purchase",
        deltaSeats: totalSeats,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: "succeeded",
        processedAt: new Date(),
        addedBy: purchasedBy,
      });

      await tx.insert(auditLogs).values({
        actorId: purchasedBy,
        action: "enterprise.license_purchased",
        targetType: "license_package",
        targetId: licensePackage.id,
        metadata: { organizationId, totalSeats, packageType, orderId: payment.razorpayOrderId },
      });

      const [org] = await tx.select().from(organizations).where(eq(organizations.id, organizationId));
      if (org?.billingEmail) {
        sendEnterpriseLicenseActivationEmail(org.billingEmail, {
          companyName: org.companyName,
          totalSeats,
          packageType,
          startDate,
          endDate,
        }).catch(err => console.error("Email send failed:", err));
      }

      console.log(`Enterprise license activated successfully: ${licensePackage.id}`);

      return {
        success: true,
        licensePackageId: licensePackage.id,
        message: "Enterprise license activated successfully",
        entitlements: { seatsTotal: totalSeats },
      };
    } catch (error: any) {
      console.error("❌ Error activating enterprise license:", error);
      throw error;
    }
  }).catch((error: any) => {
    console.error("❌ Transaction rolled back:", error);
    return {
      success: false,
      message: `Enterprise license activation failed: ${error.message}`,
    };
  });
}

/**
 * Assign a license to a user
 */
export async function assignLicenseToUser(
  licensePackageId: string,
  userId: string,
  assignedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if license package exists and has available seats
    const [licensePackage] = await db
      .select()
      .from(licensePackages)
      .where(eq(licensePackages.id, licensePackageId));

    if (!licensePackage) {
      return { success: false, message: "License package not found" };
    }

    if (licensePackage.status !== "active") {
      return { success: false, message: "License package is not active" };
    }

    // Check current assignments
    const assignments = await db
      .select()
      .from(licenseAssignments)
      .where(
        and(
          eq(licenseAssignments.licensePackageId, licensePackageId),
          eq(licenseAssignments.status, "active")
        )
      );

    if (assignments.length >= licensePackage.totalSeats) {
      return { success: false, message: "All license seats are currently assigned" };
    }

    // Check if user already has an active assignment
    const existingAssignment = assignments.find(a => a.userId === userId);
    if (existingAssignment) {
      return { success: false, message: "User already has an active license assignment" };
    }

    // Create license assignment
    await db.insert(licenseAssignments).values({
      licensePackageId,
      userId,
      status: "active",
      assignedBy,
    });

    // Ensure user has organization membership
    const [membership] = await db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, licensePackage.organizationId),
          eq(organizationMemberships.userId, userId)
        )
      );

    if (!membership) {
      await db.insert(organizationMemberships).values({
        organizationId: licensePackage.organizationId,
        userId,
        role: "member",
        status: "active",
      });
    }

    // Create audit log
    await db.insert(auditLogs).values({
      actorId: assignedBy,
      action: "enterprise.license_assigned",
      targetType: "license_assignment",
      targetId: userId,
      metadata: { licensePackageId, userId },
    });

    // Send email notification to user
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, userId));
    const [org] = await db.select().from(organizations).where(eq(organizations.id, licensePackage.organizationId));
    
    if (user?.email && org) {
      await sendLicenseAssignmentEmail(user.email, {
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        companyName: org.companyName,
        expiryDate: licensePackage.endDate,
      });
    }

    return { success: true, message: "License assigned successfully" };
  } catch (error: any) {
    console.error("❌ Error assigning license:", error);
    return { success: false, message: `License assignment failed: ${error.message}` };
  }
}

/**
 * Revoke a license from a user
 */
export async function revokeLicenseFromUser(
  licensePackageId: string,
  userId: string,
  revokedBy: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find active assignment
    const [assignment] = await db
      .select()
      .from(licenseAssignments)
      .where(
        and(
          eq(licenseAssignments.licensePackageId, licensePackageId),
          eq(licenseAssignments.userId, userId),
          eq(licenseAssignments.status, "active")
        )
      );

    if (!assignment) {
      return { success: false, message: "No active license assignment found for this user" };
    }

    // Revoke assignment
    await db
      .update(licenseAssignments)
      .set({
        status: "revoked",
        unassignedAt: new Date(),
        notes: reason || "License revoked",
      })
      .where(eq(licenseAssignments.id, assignment.id));

    // Create audit log
    await db.insert(auditLogs).values({
      actorId: revokedBy,
      action: "enterprise.license_revoked",
      targetType: "license_assignment",
      targetId: assignment.id,
      metadata: { licensePackageId, userId, reason },
    });

    return { success: true, message: "License revoked successfully" };
  } catch (error: any) {
    console.error("❌ Error revoking license:", error);
    return { success: false, message: `License revocation failed: ${error.message}` };
  }
}

/**
 * Check if a user has an active enterprise license
 */
export async function hasActiveEnterpriseLicense(userId: string): Promise<boolean> {
  const [assignment] = await db
    .select()
    .from(licenseAssignments)
    .innerJoin(licensePackages, eq(licenseAssignments.licensePackageId, licensePackages.id))
    .where(
      and(
        eq(licenseAssignments.userId, userId),
        eq(licenseAssignments.status, "active"),
        eq(licensePackages.status, "active"),
        sql`${licensePackages.endDate} > NOW()`
      )
    )
    .limit(1);

  return !!assignment;
}

// Email notification functions
async function sendSubscriptionActivationEmail(
  email: string,
  details: { planName: string; planType: string; expiryDate: Date }
) {
  const subject = "🎉 Your RevWinner Subscription is Active!";
  const html = `
    <h2>Welcome to RevWinner!</h2>
    <p>Your subscription has been successfully activated.</p>
    <h3>Subscription Details:</h3>
    <ul>
      <li><strong>Plan:</strong> ${details.planName}</li>
      <li><strong>Type:</strong> ${details.planType}</li>
      <li><strong>Valid Until:</strong> ${details.expiryDate.toLocaleDateString()}</li>
    </ul>
    <p>You can now access all features of the RevWinner Sales Assistant.</p>
    <p><a href="${process.env.APP_URL || 'https://revwinner.com'}/sales-assistant">Start using RevWinner →</a></p>
  `;

  try {
    await sendEmail({ to: email, subject, html });
    console.log(`Subscription activation email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send activation email to ${email}:`, error);
  }
}

async function sendEnterpriseLicenseActivationEmail(
  email: string,
  details: { companyName: string; totalSeats: number; packageType: string; startDate: Date; endDate: Date }
) {
  const subject = "🏢 Your Enterprise License Package is Active!";
  const html = `
    <h2>Enterprise License Activated</h2>
    <p>Your enterprise license package for ${details.companyName} has been successfully activated.</p>
    <h3>Package Details:</h3>
    <ul>
      <li><strong>Total Seats:</strong> ${details.totalSeats}</li>
      <li><strong>Package Type:</strong> ${details.packageType}</li>
      <li><strong>Start Date:</strong> ${details.startDate.toLocaleDateString()}</li>
      <li><strong>Expiry Date:</strong> ${details.endDate.toLocaleDateString()}</li>
    </ul>
    <p>You can now assign licenses to your team members through the License Manager dashboard.</p>
    <p><a href="${process.env.APP_URL || 'https://revwinner.com'}/license-manager">Manage Licenses →</a></p>
  `;

  try {
    await sendEmail({ to: email, subject, html });
    console.log(`Enterprise license activation email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send enterprise activation email to ${email}:`, error);
  }
}

async function sendLicenseAssignmentEmail(
  email: string,
  details: { userName: string; companyName: string; expiryDate: Date }
) {
  const subject = "🎫 You've Been Assigned a RevWinner License!";
  const html = `
    <h2>License Assignment Notification</h2>
    <p>Hi ${details.userName},</p>
    <p>You have been assigned a RevWinner license by ${details.companyName}.</p>
    <h3>License Details:</h3>
    <ul>
      <li><strong>Organization:</strong> ${details.companyName}</li>
      <li><strong>Valid Until:</strong> ${details.expiryDate.toLocaleDateString()}</li>
    </ul>
    <p>You can now access all features of the RevWinner Sales Assistant.</p>
    <p><a href="${process.env.APP_URL || 'https://revwinner.com'}/sales-assistant">Start using RevWinner →</a></p>
  `;

  try {
    await sendEmail({ to: email, subject, html });
    console.log(`License assignment email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send license assignment email to ${email}:`, error);
  }
}
