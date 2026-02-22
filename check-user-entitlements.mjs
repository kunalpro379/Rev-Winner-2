import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkEntitlements() {
  try {
    const userId = '2cddba37-2b80-46f8-893f-a6622cce384c'; // From the error log
    
    console.log(`\n🔍 Checking user_entitlements table structure...\n`);
    
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'user_entitlements' 
      ORDER BY ordinal_position
    `;
    
    console.log('user_entitlements columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    console.log(`\n🔍 Checking entitlements for user: ${userId}\n`);
    
    // Check user
    const [user] = await sql`
      SELECT id, email, first_name, last_name, status
      FROM auth_users 
      WHERE id = ${userId}
    `;
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   Status: ${user.status}\n`);
    
    // Check subscription
    const [subscription] = await sql`
      SELECT id, plan_type, status, sessions_limit, minutes_limit, sessions_used, minutes_used
      FROM subscriptions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    if (subscription) {
      console.log(`💳 Subscription:`);
      console.log(`   Plan: ${subscription.plan_type}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Sessions: ${subscription.sessions_used}/${subscription.sessions_limit || 'unlimited'}`);
      console.log(`   Minutes: ${subscription.minutes_used}/${subscription.minutes_limit || 'unlimited'}\n`);
    } else {
      console.log(`❌ No subscription found\n`);
    }
    
    // Check entitlements
    const [entitlements] = await sql`
      SELECT *
      FROM user_entitlements 
      WHERE user_id = ${userId}
    `;
    
    if (entitlements) {
      console.log(`🎫 Entitlements found:`);
      console.log(JSON.stringify(entitlements, null, 2));
    } else {
      console.log(`❌ No entitlements found - user needs entitlements created\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkEntitlements();
