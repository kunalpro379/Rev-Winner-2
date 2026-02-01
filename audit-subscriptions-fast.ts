import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';
import { eq, and } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  try {
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    console.log('⚡ Fast Subscription Audit (Bulk Query)\n');

    const now = new Date();

    // Bulk fetch ALL data at once
    console.log('📥 Fetching all data...');
    const [users, allPurchases, allEntitlements] = await Promise.all([
      db.select().from(schema.authUsers).where(eq(schema.authUsers.status, 'active')),
      db.select().from(schema.addonPurchases),
      db.select().from(schema.userEntitlements),
    ]);

    console.log(`✓ Loaded ${users.length} users, ${allPurchases.length} purchases, ${allEntitlements.length} entitlements\n`);

    // Group purchases by userId and addonType
    const purchasesByUser = new Map<
      string,
      Map<string, typeof allPurchases>
    >();

    for (const purchase of allPurchases) {
      if (!purchasesByUser.has(purchase.userId)) {
        purchasesByUser.set(purchase.userId, new Map());
      }
      const userPurchases = purchasesByUser.get(purchase.userId)!;
      const key = purchase.addonType;

      if (!userPurchases.has(key)) {
        userPurchases.set(key, []);
      }
      userPurchases.get(key)!.push(purchase);
    }

    // Process all users at once
    console.log('🔍 Analyzing all subscriptions...\n');

    let validCount = 0;
    let invalidCount = 0;
    const missingEntitlements: string[] = [];
    const issues: string[] = [];

    for (const user of users) {
      const userPurchases = purchasesByUser.get(user.id) || new Map();
      const userEntitlement = allEntitlements.find((e) => e.userId === user.id);

      // Get platform access
      const platformPurchases = userPurchases.get('platform_access') || [];
      const activePlatform = platformPurchases.filter(
        (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
      );

      // Get session minutes
      const minutesPurchases = userPurchases.get('session_minutes') || [];
      const activeMinutes = minutesPurchases.filter(
        (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
      );
      const totalMinutes = activeMinutes.reduce((sum, p) => sum + (p.totalUnits - p.usedUnits), 0);

      // Get train me
      const trainMePurchases = userPurchases.get('train_me') || [];
      const activeTrainMe = trainMePurchases.filter(
        (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
      );

      // Get DAI
      const daiPurchases = userPurchases.get('dai') || [];
      const activeDai = daiPurchases.filter(
        (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
      );

      // Check if can access platform (BOTH platform access AND session minutes required)
      const canAccess = activePlatform.length > 0 && totalMinutes > 0;

      if (canAccess) {
        validCount++;
      } else {
        invalidCount++;
        const reason = [];
        if (activePlatform.length === 0) reason.push('no platform');
        if (totalMinutes === 0) reason.push('no minutes');
        issues.push(`${user.email}: ${reason.join(', ')}`);
      }

      if (!userEntitlement) {
        missingEntitlements.push(user.id);
      }
    }

    console.log('📊 RESULTS:');
    console.log(`   ✅ Valid (Platform + Minutes): ${validCount}`);
    console.log(`   ❌ Invalid/Incomplete: ${invalidCount}`);
    console.log(`   📋 Missing Entitlements: ${missingEntitlements.length}\n`);

    if (issues.length > 0) {
      console.log('❌ Issues found:');
      issues.slice(0, 10).forEach((issue) => console.log(`   • ${issue}`));
      if (issues.length > 10) console.log(`   ... and ${issues.length - 10} more\n`);
    }

    // Create missing entitlements
    if (missingEntitlements.length > 0) {
      console.log(`\n🔧 Creating ${missingEntitlements.length} missing entitlements...\n`);

      let created = 0;
      for (const userId of missingEntitlements) {
        const userPurchases = purchasesByUser.get(userId) || new Map();

        const platformPurchases = userPurchases.get('platform_access') || [];
        const activePlatform = platformPurchases.find(
          (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
        );

        const minutesPurchases = userPurchases.get('session_minutes') || [];
        const activeMinutes = minutesPurchases.filter(
          (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
        );
        const totalMinutes = activeMinutes.reduce((sum, p) => sum + (p.totalUnits - p.usedUnits), 0);
        const latestMinutesExpiry = minutesPurchases.length > 0 
          ? minutesPurchases.reduce((max, p) => (!p.endDate || (max && max > p.endDate) ? max : p.endDate), null as Date | null)
          : null;

        const trainMePurchases = userPurchases.get('train_me') || [];
        const activeTrainMe = trainMePurchases.find(
          (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
        );

        const daiPurchases = userPurchases.get('dai') || [];
        const activeDai = daiPurchases.find(
          (p) => p.status === 'active' && (!p.endDate || p.endDate > now)
        );

        try {
          await db.insert(schema.userEntitlements).values({
            userId,
            hasPlatformAccess: !!activePlatform,
            platformAccessExpiresAt: activePlatform?.endDate || null,
            sessionMinutesBalance: totalMinutes,
            sessionMinutesExpiresAt: latestMinutesExpiry,
            hasTrainMe: !!activeTrainMe,
            trainMeExpiresAt: activeTrainMe?.endDate || null,
            hasDai: !!activeDai,
            daiTokensBalance: activeDai ? activeDai.totalUnits - activeDai.usedUnits : 0,
            daiExpiresAt: activeDai?.endDate || null,
          });
          created++;
        } catch (err: any) {
          if (!err.message.includes('duplicate')) {
            console.error(`   ❌ Failed to create entitlements for user ${userId}:`, err.message);
          }
        }
      }

      console.log(`   ✓ Created ${created} entitlements\n`);
    }

    console.log('🎉 Done! Audit complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
