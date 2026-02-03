import cron from 'node-cron';
import { db } from '../db';
import { subscriptions, addonPurchases, pendingOrders, licensePackages, organizations, authUsers, licenseAssignments } from '../../shared/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { AuthStorage } from '../storage-auth';
import { BillingStorage } from '../storage-billing';
import { recordingsStorage } from '../storage-recordings';
import { runBillingReconciliation } from './billing-reconciliation';
import { meetingMinutesBackupService } from './meeting-minutes-backup';
import { sendExpiryWarningEmail } from './email';

const authStorage = new AuthStorage();
const billingStorage = new BillingStorage();

/**
 * Operations Automation Layer
 * 
 * Scheduled jobs for:
 * - Subscription expiration
 * - Add-on expiration
 * - Pending order cleanup
 * - Usage reconciliation
 */

/**
 * Expire subscriptions that have passed their end date
 */
async function expireSubscriptions() {
  try {
    console.log('Running subscription expiration job...');
    
    const result = await db
      .update(subscriptions)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.currentPeriodEnd, new Date())
        )
      );
    
    const expiredCount = result.rowCount || 0;
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} subscription(s)`);
    } else {
      console.log('No subscriptions to expire');
    }
    
    return expiredCount;
  } catch (error) {
    console.error('❌ Error expiring subscriptions:', error);
    return 0;
  }
}

/**
 * Expire license packages that have passed their end date
 */
async function expireLicensePackages() {
  try {
    console.log('Running license package expiration job...');
    
    const result = await db
      .update(licensePackages)
      .set({ status: 'expired' })
      .where(
        and(
          eq(licensePackages.status, 'active'),
          lte(licensePackages.endDate, new Date())
        )
      );
    
    const expiredCount = result.rowCount || 0;
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} license package(s)`);
    } else {
      console.log('No license packages to expire');
    }
    
    return expiredCount;
  } catch (error) {
    console.error('❌ Error expiring license packages:', error);
    return 0;
  }
}

/**
 * Send expiry warning emails for subscriptions expiring soon (7 days and 3 days)
 */
async function sendExpiryWarnings() {
  try {
    console.log('Running expiry warning notifications job...');
    let emailsSent = 0;
    
    // Get subscriptions expiring in exactly 7 days or 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const warningDays = [7, 3];
    
    for (const days of warningDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Get expiring subscriptions
      const expiringSubscriptions = await db
        .select({
          subscription: subscriptions,
          user: authUsers
        })
        .from(subscriptions)
        .innerJoin(authUsers, eq(subscriptions.userId, authUsers.id))
        .where(
          and(
            eq(subscriptions.status, 'active'),
            gte(subscriptions.currentPeriodEnd, targetDate),
            lte(subscriptions.currentPeriodEnd, nextDay)
          )
        );
      
      for (const { subscription, user } of expiringSubscriptions) {
        try {
          await sendExpiryWarningEmail(
            user.email,
            user.firstName || 'User',
            'subscription',
            days,
            {
              name: subscription.planType || 'Subscription',
              expiryDate: new Date(subscription.currentPeriodEnd!),
            }
          );
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send expiry warning to ${user.email}:`, error);
        }
      }
      
      // Get expiring license packages (notify license manager)
      const expiringPackages = await db
        .select({
          package: licensePackages,
          org: organizations
        })
        .from(licensePackages)
        .innerJoin(organizations, eq(licensePackages.organizationId, organizations.id))
        .where(
          and(
            eq(licensePackages.status, 'active'),
            gte(licensePackages.endDate, targetDate),
            lte(licensePackages.endDate, nextDay)
          )
        );
      
      for (const { package: pkg, org } of expiringPackages) {
        try {
          // Get the license manager
          if (org.primaryManagerId) {
            const manager = await authStorage.getUserById(org.primaryManagerId);
            if (manager) {
              await sendExpiryWarningEmail(
                manager.email,
                manager.firstName || 'License Manager',
                'license',
                days,
                {
                  name: pkg.packageType || 'License Package',
                  expiryDate: new Date(pkg.endDate),
                  organizationName: org.companyName
                }
              );
              emailsSent++;
            }
          }
        } catch (error) {
          console.error(`Failed to send license expiry warning for org ${org.id}:`, error);
        }
      }
    }
    
    if (emailsSent > 0) {
      console.log(`Sent ${emailsSent} expiry warning email(s)`);
    } else {
      console.log('No expiry warnings to send');
    }
    
    return emailsSent;
  } catch (error) {
    console.error('❌ Error sending expiry warnings:', error);
    return 0;
  }
}

/**
 * Expire add-on purchases that have passed their end date
 */
async function expireAddons() {
  try {
    console.log('Running add-on expiration job...');
    
    const expiredCount = await billingStorage.expireAddonPurchases();
    
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} add-on(s)`);
    } else {
      console.log('No add-ons to expire');
    }
    
    return expiredCount;
  } catch (error) {
    console.error('❌ Error expiring add-ons:', error);
    return 0;
  }
}

/**
 * Clean up pending orders that have expired
 */
async function cleanupPendingOrders() {
  try {
    console.log('Running pending order cleanup job...');
    
    const expiredCount = await billingStorage.expirePendingOrders();
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired pending order(s)`);
    } else {
      console.log('No pending orders to clean up');
    }
    
    return expiredCount;
  } catch (error) {
    console.error('❌ Error cleaning up pending orders:', error);
    return 0;
  }
}

/**
 * Delete call recordings that have expired (> 7 days old)
 */
async function deleteExpiredCallRecordings() {
  try {
    console.log('Running call recordings cleanup job...');
    
    const deletedCount = await recordingsStorage.deleteExpiredRecordings();
    
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired call recording(s)`);
    } else {
      console.log('No expired call recordings to delete');
    }
    
    return deletedCount;
  } catch (error) {
    console.error('❌ Error deleting expired call recordings:', error);
    return 0;
  }
}

/**
 * Delete meeting minutes that have expired (> 7 days old)
 */
async function deleteExpiredMeetingMinutes() {
  try {
    console.log('Running meeting minutes cleanup job...');
    
    const deletedCount = await recordingsStorage.deleteExpiredMeetingMinutes();
    
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired meeting minutes record(s)`);
    } else {
      console.log('No expired meeting minutes to delete');
    }
    
    return deletedCount;
  } catch (error) {
    console.error('❌ Error deleting expired meeting minutes:', error);
    return 0;
  }
}

/**
 * Reconcile usage tracking to ensure data integrity
 * Validates that minutesUsed matches sessionHistory totals
 */
async function reconcileUsageTracking() {
  try {
    console.log('Running usage reconciliation job...');
    
    // Get all active subscriptions with session history
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    let reconciledCount = 0;
    let discrepancyCount = 0;
    
    for (const subscription of activeSubscriptions) {
      if (!subscription.sessionHistory || !Array.isArray(subscription.sessionHistory)) {
        continue;
      }
      
      // Calculate actual usage from session history
      const actualMinutes = subscription.sessionHistory.reduce((sum: number, session: any) => {
        return sum + (session.durationMinutes || 0);
      }, 0);
      
      const actualSessions = subscription.sessionHistory.length;
      
      // Compare with stored values
      const storedMinutes = parseInt(subscription.minutesUsed || '0') || 0;
      const storedSessions = parseInt(subscription.sessionsUsed || '0') || 0;
      
      // If there's a discrepancy, log it and fix it
      if (actualMinutes !== storedMinutes || actualSessions !== storedSessions) {
        console.warn(`⚠️ Usage discrepancy for subscription ${subscription.id}:`);
        console.warn(`  Sessions: stored=${storedSessions}, actual=${actualSessions}`);
        console.warn(`  Minutes: stored=${storedMinutes}, actual=${actualMinutes}`);
        
        await authStorage.updateSubscription(subscription.id, {
          sessionsUsed: actualSessions.toString(),
          minutesUsed: actualMinutes.toString()
        });
        
        reconciledCount++;
        discrepancyCount++;
      }
    }
    
    if (discrepancyCount > 0) {
      console.log(`Reconciled ${reconciledCount} subscription(s) with usage discrepancies`);
    } else {
      console.log('All usage tracking is consistent');
    }
    
    return reconciledCount;
  } catch (error) {
    console.error('❌ Error reconciling usage tracking:', error);
    return 0;
  }
}

/**
 * Backup all conversation data in Meeting Minutes format
 * For marketing analysis, best practices extraction, and content generation
 */
async function backupConversationMinutes() {
  try {
    console.log(' Running conversation minutes backup job...');
    
    const stats = await meetingMinutesBackupService.backupAllConversations('scheduled');
    
    console.log(`Backup completed: ${stats.successfulBackups} new, ${stats.skippedBackups} skipped, ${stats.failedBackups} failed`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error backing up conversation minutes:', error);
    return null;
  }
}

/**
 * Combined daily maintenance job
 * Runs all expiration and cleanup tasks
 */
async function runDailyMaintenance() {
  console.log(' Starting daily maintenance job...');
  const startTime = Date.now();
  
  // Send expiry warnings BEFORE expiring anything
  await sendExpiryWarnings();
  
  // Expire subscriptions and license packages
  await expireSubscriptions();
  await expireLicensePackages();
  await expireAddons();
  await cleanupPendingOrders();
  await deleteExpiredCallRecordings();
  await deleteExpiredMeetingMinutes();
  
  // Run billing reconciliation to detect payment/entitlement discrepancies
  await runBillingReconciliation();
  
  // Backup conversation minutes for marketing/analysis
  await backupConversationMinutes();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Daily maintenance completed in ${duration}s`);
}

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs() {
  console.log(' Initializing scheduled jobs...');
  
  // Daily maintenance at 2:00 AM
  cron.schedule('0 2 * * *', runDailyMaintenance, {
    timezone: 'UTC'
  });
  console.log('  ✓ Daily maintenance job scheduled (2:00 AM UTC)');
  
  // Usage reconciliation every 6 hours
  cron.schedule('0 */6 * * *', reconcileUsageTracking, {
    timezone: 'UTC'
  });
  console.log('  ✓ Usage reconciliation job scheduled (every 6 hours)');
  
  // Run initial maintenance check on startup (after 30 seconds)
  setTimeout(() => {
    console.log('Running initial maintenance check...');
    runDailyMaintenance();
  }, 30000);
  
  console.log('Scheduled jobs initialized successfully');
}

// Export individual functions for testing/manual invocation
export {
  expireSubscriptions,
  expireLicensePackages,
  expireAddons,
  cleanupPendingOrders,
  deleteExpiredCallRecordings,
  deleteExpiredMeetingMinutes,
  reconcileUsageTracking,
  sendExpiryWarnings,
  backupConversationMinutes,
  runDailyMaintenance
};
