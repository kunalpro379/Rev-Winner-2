import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';
import { eq, and, or, isNotNull, isNull, lt, gte } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

interface UserSubscriptionStatus {
  userId: string;
  email: string;
  platformAccess: {
    hasAccess: boolean;
    expiresAt: Date | null;
    isExpired: boolean;
  };
  sessionMinutes: {
    hasMinutes: boolean;
    totalRemaining: number;
    expiresAt: Date | null;
    isExpired: boolean;
  };
  trainMe: {
    hasAccess: boolean;
    expiresAt: Date | null;
    isExpired: boolean;
  };
  dai: {
    hasAccess: boolean;
    tokensRemaining: number;
    expiresAt: Date | null;
    isExpired: boolean;
  };
  canAccessPlatform: boolean;
  errors: string[];
}

async function main() {
  try {
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    console.log('🔧 Comprehensive Subscription Fix...\n');

    // Get all users
    const users = await db
      .select()
      .from(schema.authUsers)
      .where(eq(schema.authUsers.status, 'active'));

    console.log(`📊 Found ${users.length} active users\n`);

    const userStatusList: UserSubscriptionStatus[] = [];
    const now = new Date();

    for (const user of users) {
      const errors: string[] = [];

      // 1. Check Platform Access (from addon_purchases or subscriptions table)
      const platformAccessPurchases = await db
        .select()
        .from(schema.addonPurchases)
        .where(
          and(
            eq(schema.addonPurchases.userId, user.id),
            eq(schema.addonPurchases.addonType, 'platform_access'),
            eq(schema.addonPurchases.status, 'active')
          )
        );

      const platformAccess = platformAccessPurchases[0];
      const platformAccessExpired =
        platformAccess && platformAccess.endDate ? platformAccess.endDate < now : false;

      if (platformAccessPurchases.length > 1) {
        errors.push(`⚠️ Multiple active platform access purchases (${platformAccessPurchases.length})`);
      }

      // 2. Check Session Minutes (from addon_purchases)
      const sessionMinutesPurchases = await db
        .select()
        .from(schema.addonPurchases)
        .where(
          and(
            eq(schema.addonPurchases.userId, user.id),
            eq(schema.addonPurchases.addonType, 'session_minutes'),
            eq(schema.addonPurchases.status, 'active')
          )
        );

      // Calculate total session minutes remaining
      let totalSessionMinutesRemaining = 0;
      let oldestMinutesExpiry: Date | null = null;

      for (const purchase of sessionMinutesPurchases) {
        const remaining = purchase.totalUnits - purchase.usedUnits;
        totalSessionMinutesRemaining += remaining;
        if (!oldestMinutesExpiry || (purchase.endDate && purchase.endDate < oldestMinutesExpiry)) {
          oldestMinutesExpiry = purchase.endDate;
        }
      }

      const sessionMinutesExpired =
        oldestMinutesExpiry && oldestMinutesExpiry < now ? true : false;

      // 3. Check Train Me (from addon_purchases)
      const trainMePurchases = await db
        .select()
        .from(schema.addonPurchases)
        .where(
          and(
            eq(schema.addonPurchases.userId, user.id),
            eq(schema.addonPurchases.addonType, 'train_me'),
            eq(schema.addonPurchases.status, 'active')
          )
        );

      const trainMe = trainMePurchases[0];
      const trainMeExpired = trainMe && trainMe.endDate ? trainMe.endDate < now : false;

      if (trainMePurchases.length > 1) {
        errors.push(`⚠️ Multiple active Train Me purchases (${trainMePurchases.length})`);
      }

      // 4. Check DAI (from addon_purchases)
      const daiPurchases = await db
        .select()
        .from(schema.addonPurchases)
        .where(
          and(
            eq(schema.addonPurchases.userId, user.id),
            eq(schema.addonPurchases.addonType, 'dai'),
            eq(schema.addonPurchases.status, 'active')
          )
        );

      const daiPurchase = daiPurchases[0];
      const daiTokensRemaining = daiPurchase ? daiPurchase.totalUnits - daiPurchase.usedUnits : 0;
      const daiExpired = daiPurchase && daiPurchase.endDate ? daiPurchase.endDate < now : false;

      // KEY REQUIREMENT: Platform access AND session minutes both required
      const canAccessPlatform =
        platformAccess && !platformAccessExpired && totalSessionMinutesRemaining > 0 && !sessionMinutesExpired;

      if (!platformAccess || platformAccessExpired) {
        errors.push('❌ No active platform access or expired');
      }
      if (sessionMinutesPurchases.length === 0 || totalSessionMinutesRemaining === 0 || sessionMinutesExpired) {
        errors.push('❌ No active session minutes or depleted');
      }

      const status: UserSubscriptionStatus = {
        userId: user.id,
        email: user.email || 'N/A',
        platformAccess: {
          hasAccess: !!platformAccess && !platformAccessExpired,
          expiresAt: platformAccess?.endDate || null,
          isExpired: platformAccessExpired,
        },
        sessionMinutes: {
          hasMinutes: totalSessionMinutesRemaining > 0,
          totalRemaining: totalSessionMinutesRemaining,
          expiresAt: oldestMinutesExpiry,
          isExpired: sessionMinutesExpired,
        },
        trainMe: {
          hasAccess: !!trainMe && !trainMeExpired,
          expiresAt: trainMe?.endDate || null,
          isExpired: trainMeExpired,
        },
        dai: {
          hasAccess: !!daiPurchase && !daiExpired,
          tokensRemaining: daiTokensRemaining,
          expiresAt: daiPurchase?.endDate || null,
          isExpired: daiExpired,
        },
        canAccessPlatform,
        errors,
      };

      userStatusList.push(status);
    }

    // Display report
    console.log('📋 SUBSCRIPTION STATUS REPORT\n');
    console.log('='.repeat(80));

    const validUsers = userStatusList.filter((u) => u.canAccessPlatform);
    const invalidUsers = userStatusList.filter((u) => !u.canAccessPlatform);

    console.log(`\n✅ Users with VALID access (both platform & minutes): ${validUsers.length}`);
    console.log(`❌ Users with MISSING access: ${invalidUsers.length}\n`);

    // Show valid users
    if (validUsers.length > 0) {
      console.log('\n✅ VALID USERS:\n');
      validUsers.slice(0, 5).forEach((user) => {
        console.log(`  📧 ${user.email}`);
        console.log(`     Platform: ${user.platformAccess.hasAccess} (expires: ${user.platformAccess.expiresAt?.toISOString().split('T')[0] || 'N/A'})`);
        console.log(`     Session Minutes: ${user.sessionMinutes.totalRemaining} minutes remaining`);
        console.log(`     Train Me: ${user.trainMe.hasAccess ? '✓' : '✗'}`);
        console.log(`     DAI: ${user.dai.hasAccess ? `✓ (${user.dai.tokensRemaining} tokens)` : '✗'}`);
        console.log();
      });
    }

    // Show invalid users with errors
    if (invalidUsers.length > 0) {
      console.log('\n❌ USERS WITH ISSUES:\n');
      invalidUsers.slice(0, 10).forEach((user) => {
        console.log(`  📧 ${user.email}`);
        user.errors.forEach((err) => console.log(`     ${err}`));
        console.log();
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total Active Users: ${userStatusList.length}`);
    console.log(`   • Valid Access: ${validUsers.length}`);
    console.log(`   • Missing Access: ${invalidUsers.length}`);
    console.log(`   • Health: ${((validUsers.length / userStatusList.length) * 100).toFixed(1)}%\n`);

    // Also check for orphaned purchases (users deleted but purchases remain)
    console.log('🔍 Checking for orphaned addon purchases...');
    const allPurchases = await db.select().from(schema.addonPurchases);
    const userIds = new Set(users.map((u) => u.id));
    const orphanedPurchases = allPurchases.filter((p) => !userIds.has(p.userId));

    if (orphanedPurchases.length > 0) {
      console.log(`   ⚠️ Found ${orphanedPurchases.length} orphaned addon purchases\n`);
    } else {
      console.log(`   ✓ No orphaned purchases found\n`);
    }

    // Check user_entitlements sync
    console.log('🔍 Checking user_entitlements table sync...');
    const entitlements = await db.select().from(schema.userEntitlements);
    const entitlementUserIds = new Set(entitlements.map((e) => e.userId));
    const missingEntitlements = users.filter((u) => !entitlementUserIds.has(u.id));

    if (missingEntitlements.length > 0) {
      console.log(`   ⚠️ ${missingEntitlements.length} users missing entitlements records`);
      console.log(`   Creating missing entitlements...\n`);

      for (const user of missingEntitlements) {
        // Find their active purchases
        const platformAccess = await db
          .select()
          .from(schema.addonPurchases)
          .where(
            and(
              eq(schema.addonPurchases.userId, user.id),
              eq(schema.addonPurchases.addonType, 'platform_access'),
              eq(schema.addonPurchases.status, 'active')
            )
          )
          .then((r) => r[0]);

        const sessionMinutes = await db
          .select()
          .from(schema.addonPurchases)
          .where(
            and(
              eq(schema.addonPurchases.userId, user.id),
              eq(schema.addonPurchases.addonType, 'session_minutes'),
              eq(schema.addonPurchases.status, 'active')
            )
          );

        const trainMe = await db
          .select()
          .from(schema.addonPurchases)
          .where(
            and(
              eq(schema.addonPurchases.userId, user.id),
              eq(schema.addonPurchases.addonType, 'train_me'),
              eq(schema.addonPurchases.status, 'active')
            )
          )
          .then((r) => r[0]);

        const dai = await db
          .select()
          .from(schema.addonPurchases)
          .where(
            and(
              eq(schema.addonPurchases.userId, user.id),
              eq(schema.addonPurchases.addonType, 'dai'),
              eq(schema.addonPurchases.status, 'active')
            )
          )
          .then((r) => r[0]);

        // Calculate total session minutes
        const allSessionMinutes = await db
          .select()
          .from(schema.addonPurchases)
          .where(
            and(
              eq(schema.addonPurchases.userId, user.id),
              eq(schema.addonPurchases.addonType, 'session_minutes')
            )
          );

        const totalMinutesRemaining = allSessionMinutes.reduce((sum, p) => sum + (p.totalUnits - p.usedUnits), 0);

        await db.insert(schema.userEntitlements).values({
          userId: user.id,
          hasPlatformAccess: !!platformAccess && platformAccess.endDate > now,
          platformAccessExpiresAt: platformAccess?.endDate || null,
          sessionMinutesBalance: totalMinutesRemaining,
          sessionMinutesExpiresAt: allSessionMinutes[allSessionMinutes.length - 1]?.endDate || null,
          hasTrainMe: !!trainMe && trainMe.endDate > now,
          trainMeExpiresAt: trainMe?.endDate || null,
          hasDai: !!dai && dai.endDate > now,
          daiTokensBalance: dai ? dai.totalUnits - dai.usedUnits : 0,
          daiExpiresAt: dai?.endDate || null,
        });
      }

      console.log(`   ✓ Created ${missingEntitlements.length} entitlements records\n`);
    } else {
      console.log(`   ✓ All users have entitlements records\n`);
    }

    console.log('🎉 Subscription fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
