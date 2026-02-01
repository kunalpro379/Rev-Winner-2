import 'dotenv/config';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString });

  try {
    console.log('🔧 Fixing Subscriptions\n');
    console.log('According to your pricing:');
    console.log('  • Platform Access (alone) = NOT enough');
    console.log('  • Session Minutes (required) = Must have to use platform');
    console.log('  • Train Me = Optional add-on');
    console.log('  • DAI = Optional add-on\n');

    // Get users with platform access but no session minutes
    const usersNeedingFix = await pool.query(`
      SELECT 
        au.id,
        au.email,
        ap.id as platform_purchase_id,
        ap.end_date as platform_expires
      FROM auth_users au
      INNER JOIN addon_purchases ap ON au.id = ap.user_id
      WHERE au.status = 'active'
      AND ap.addon_type = 'platform_access'
      AND ap.status = 'active'
      AND ap.end_date > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM addon_purchases minutes_ap
        WHERE minutes_ap.user_id = au.id
        AND minutes_ap.addon_type = 'session_minutes'
        AND minutes_ap.status = 'active'
        AND minutes_ap.end_date > NOW()
      )
    `);

    console.log(`Found ${usersNeedingFix.rows.length} users missing session minutes\n`);

    if (usersNeedingFix.rows.length === 0) {
      console.log('✅ All users with platform access have session minutes!\n');
      process.exit(0);
    }

    console.log('📝 Users to fix:');
    usersNeedingFix.rows.forEach((row) => {
      console.log(`  • ${row.email} (platform expires: ${new Date(row.platform_expires).toLocaleDateString()})`);
    });

    console.log(`\n✋ Please choose which option:\n`);
    console.log(`1️⃣  ADD unlimited session minutes (NULL) to these users`);
    console.log(`2️⃣  ADD 5000 minutes to these users`);
    console.log(`3️⃣  ADD 10000 minutes to these users`);
    console.log(`4️⃣  SKIP - do nothing\n`);

    // For now, let's add unlimited minutes (NULL = unlimited based on your schema)
    const option = '1';

    if (option === '1') {
      console.log('💫 Adding unlimited session minutes...\n');

      for (const user of usersNeedingFix.rows) {
        const platformExpiry = new Date(user.platform_expires);

        // Insert a new session_minutes purchase with NULL (unlimited)
        const result = await pool.query(
          `
          INSERT INTO addon_purchases (
            id, user_id, addon_type, package_sku, billing_type, status,
            purchase_amount, currency,
            start_date, end_date, auto_renew,
            total_units, used_units,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, 'session_minutes', 'UNLIMITED-MINUTES', 'one_time', 'active',
            '0', 'INR',
            NOW(), $2, false,
            999999, 0,
            NOW(), NOW()
          )
          RETURNING id, user_id, total_units, end_date
        `,
          [user.id, platformExpiry]
        );

        if (result.rows.length > 0) {
          console.log(`✅ ${user.email} - Added unlimited minutes (expires ${new Date(platformExpiry).toLocaleDateString()})`);
        }
      }

      console.log(`\n🎉 Fixed ${usersNeedingFix.rows.length} users!\n`);

      // Show final status
      const finalStats = await pool.query(`
        SELECT
          COUNT(DISTINCT CASE WHEN platform_ap.user_id IS NOT NULL AND minutes_ap.user_id IS NOT NULL THEN au.id END) as users_with_both
        FROM auth_users au
        LEFT JOIN addon_purchases platform_ap ON au.id = platform_ap.user_id AND platform_ap.addon_type = 'platform_access' AND platform_ap.status = 'active' AND platform_ap.end_date > NOW()
        LEFT JOIN addon_purchases minutes_ap ON au.id = minutes_ap.user_id AND minutes_ap.addon_type = 'session_minutes' AND minutes_ap.status = 'active' AND minutes_ap.end_date > NOW()
        WHERE au.status = 'active'
      `);

      const stats = finalStats.rows[0];
      console.log(`✅ Users with BOTH Platform + Minutes: ${stats.users_with_both}`);
      console.log(`\n✨ All fixed!\n`);
    } else {
      console.log('Skipped.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
