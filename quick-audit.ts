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
    console.log('⚡ Subscription Audit (Raw SQL)\n');

    // 1. Count users by subscription status
    console.log(' User Subscription Status:');
    const userStats = await pool.query(`
      SELECT 
        au.id,
        au.email,
        COUNT(CASE WHEN ap.addon_type = 'platform_access' AND ap.status = 'active' THEN 1 END) as platform_count,
        COUNT(CASE WHEN ap.addon_type = 'session_minutes' AND ap.status = 'active' THEN 1 END) as minutes_count,
        COALESCE(SUM(CASE WHEN ap.addon_type = 'session_minutes' AND ap.status = 'active' THEN ap.total_units - ap.used_units ELSE 0 END), 0) as minutes_remaining,
        COUNT(CASE WHEN ap.addon_type = 'train_me' AND ap.status = 'active' THEN 1 END) as train_me_count,
        COUNT(CASE WHEN ap.addon_type = 'dai' AND ap.status = 'active' THEN 1 END) as dai_count
      FROM auth_users au
      LEFT JOIN addon_purchases ap ON au.id = ap.user_id AND ap.status = 'active' AND ap.end_date > NOW()
      WHERE au.status = 'active'
      GROUP BY au.id, au.email
      LIMIT 20
    `);

    console.log('\n Top 20 Users:');
    console.log('Email | Platform | Minutes | Minutes Remaining | TrainMe | DAI');
    console.log('-'.repeat(80));
    for (const row of userStats.rows) {
      const canAccess = row.platform_count > 0 && row.minutes_remaining > 0 ? '✅' : '❌';
      console.log(
        `${row.email.substring(0, 30).padEnd(30)} | ${row.platform_count} | ${row.minutes_count} | ${row.minutes_remaining.toString().padStart(17)} | ${row.train_me_count} | ${row.dai_count} ${canAccess}`
      );
    }

    // 2. Summary stats
    console.log('\n\n📈 Summary Statistics:');
    const summary = await pool.query(`
      SELECT
        COUNT(DISTINCT au.id) as total_users,
        COUNT(DISTINCT CASE WHEN platform_ap.user_id IS NOT NULL THEN au.id END) as users_with_platform,
        COUNT(DISTINCT CASE WHEN minutes_ap.user_id IS NOT NULL THEN au.id END) as users_with_minutes,
        COUNT(DISTINCT CASE WHEN platform_ap.user_id IS NOT NULL AND minutes_ap.user_id IS NOT NULL THEN au.id END) as users_with_both,
        COUNT(DISTINCT CASE WHEN train_me_ap.user_id IS NOT NULL THEN au.id END) as users_with_train_me,
        COUNT(DISTINCT CASE WHEN dai_ap.user_id IS NOT NULL THEN au.id END) as users_with_dai
      FROM auth_users au
      LEFT JOIN addon_purchases platform_ap ON au.id = platform_ap.user_id AND platform_ap.addon_type = 'platform_access' AND platform_ap.status = 'active' AND platform_ap.end_date > NOW()
      LEFT JOIN addon_purchases minutes_ap ON au.id = minutes_ap.user_id AND minutes_ap.addon_type = 'session_minutes' AND minutes_ap.status = 'active' AND minutes_ap.end_date > NOW()
      LEFT JOIN addon_purchases train_me_ap ON au.id = train_me_ap.user_id AND train_me_ap.addon_type = 'train_me' AND train_me_ap.status = 'active' AND train_me_ap.end_date > NOW()
      LEFT JOIN addon_purchases dai_ap ON au.id = dai_ap.user_id AND dai_ap.addon_type = 'dai' AND dai_ap.status = 'active' AND dai_ap.end_date > NOW()
      WHERE au.status = 'active'
    `);

    const stats = summary.rows[0];
    console.log(`  Total Active Users: ${stats.total_users}`);
    console.log(`  Users with Platform Access: ${stats.users_with_platform}`);
    console.log(`  Users with Session Minutes: ${stats.users_with_minutes}`);
    console.log(`  Users with BOTH (Can Access): ${stats.users_with_both} ✅`);
    console.log(`  Users Missing Minutes: ${stats.total_users - stats.users_with_both} ❌`);
    console.log(`  Users with Train Me: ${stats.users_with_train_me}`);
    console.log(`  Users with DAI: ${stats.users_with_dai}\n`);

    // 3. Missing addons
    console.log('\n❌ Users Missing Session Minutes (but have platform access):');
    const missingMinutes = await pool.query(`
      SELECT au.email
      FROM auth_users au
      WHERE au.status = 'active'
      AND EXISTS (
        SELECT 1 FROM addon_purchases ap 
        WHERE ap.user_id = au.id 
        AND ap.addon_type = 'platform_access'
        AND ap.status = 'active'
        AND ap.end_date > NOW()
      )
      AND NOT EXISTS (
        SELECT 1 FROM addon_purchases ap 
        WHERE ap.user_id = au.id 
        AND ap.addon_type = 'session_minutes'
        AND ap.status = 'active'
        AND ap.end_date > NOW()
      )
      LIMIT 10
    `);

    if (missingMinutes.rows.length > 0) {
      missingMinutes.rows.forEach((row) => console.log(`  • ${row.email}`));
    } else {
      console.log('  None - All users have platform + minutes! ✅');
    }

    console.log('\n🎉 Audit Complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
