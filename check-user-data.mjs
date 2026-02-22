import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkUserData() {
  try {
    console.log('\n🔍 Checking recently registered users...\n');
    
    // Get the most recent user
    const users = await sql`
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
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} recent users:\n`);
    
    for (const user of users) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.first_name} ${user.last_name}`);
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
        SELECT code, expires_at, used
        FROM otps 
        WHERE email = ${user.email}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (otp.length > 0 && !otp[0].used) {
        console.log(`\n🔐 Pending OTP: ${otp[0].code}`);
        console.log(`   Expires: ${otp[0].expires_at}`);
        console.log(`   Status: ${otp[0].used ? 'Used' : 'Not Used'}`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkUserData();
