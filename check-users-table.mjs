import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkUsersTable() {
  try {
    console.log('\n📋 Checking auth_users table...\n');
    const authUsersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'auth_users' 
      ORDER BY ordinal_position
    `;
    
    console.log('Auth_users table columns:');
    authUsersColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
    });
    console.log(`Total: ${authUsersColumns.length} columns\n`);
    
    console.log('📋 Checking recent users in auth_users...\n');
    const recentUsers = await sql`
      SELECT 
        id, 
        email, 
        username, 
        first_name, 
        last_name, 
        organization,
        mobile,
        status,
        email_verified,
        created_at
      FROM auth_users 
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    if (recentUsers.length === 0) {
      console.log('❌ No users found in auth_users table\n');
      return;
    }
    
    console.log(`✅ Found ${recentUsers.length} recent users:\n`);
    
    for (const user of recentUsers) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.first_name} ${user.last_name}`);
      console.log(`🆔 Username: ${user.username}`);
      console.log(`🏢 Organization: ${user.organization || 'N/A'}`);
      console.log(`📱 Mobile: ${user.mobile || 'N/A'}`);
      console.log(`✅ Status: ${user.status}`);
      console.log(`📬 Email Verified: ${user.email_verified}`);
      console.log(`📅 Created: ${user.created_at}`);
      console.log(`🆔 User ID: ${user.id}`);
      
      // Check if user has subscription
      const subscription = await sql`
        SELECT 
          id,
          plan_type,
          status,
          sessions_used,
          sessions_limit,
          minutes_used,
          minutes_limit
        FROM subscriptions 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (subscription.length > 0) {
        console.log(`\n💳 Subscription:`);
        console.log(`   Plan: ${subscription[0].plan_type}`);
        console.log(`   Status: ${subscription[0].status}`);
        console.log(`   Sessions: ${subscription[0].sessions_used}/${subscription[0].sessions_limit}`);
        console.log(`   Minutes: ${subscription[0].minutes_used}/${subscription[0].minutes_limit}`);
      } else {
        console.log(`\n❌ No subscription found`);
      }
      
      // Check if user has OTP pending
      const otp = await sql`
        SELECT code, expires_at, is_used
        FROM otps 
        WHERE email = ${user.email}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (otp.length > 0) {
        console.log(`\n🔐 Latest OTP: ${otp[0].code}`);
        console.log(`   Expires: ${otp[0].expires_at}`);
        console.log(`   Status: ${otp[0].is_used ? 'Used' : 'Not Used'}`);
        
        const now = new Date();
        const expiresAt = new Date(otp[0].expires_at);
        const isExpired = now > expiresAt;
        
        if (!otp[0].is_used && !isExpired) {
          console.log(`   ⚠️  VALID OTP - User needs to verify email!`);
        } else if (isExpired) {
          console.log(`   ❌ EXPIRED - User needs to request new OTP`);
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkUsersTable();
