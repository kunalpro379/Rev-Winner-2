import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function verifyUser() {
  try {
    const email = 'nilibilu@forexzig.com'; // Latest registered user
    
    console.log(`\n🔍 Manually verifying user: ${email}\n`);
    
    // Get user
    const [user] = await sql`
      SELECT id, email, first_name, status, email_verified
      FROM auth_users 
      WHERE email = ${email}
    `;
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`Found user: ${user.first_name} (${user.email})`);
    console.log(`Current status: ${user.status}`);
    console.log(`Email verified: ${user.email_verified}\n`);
    
    if (user.status === 'active' && user.email_verified) {
      console.log('✅ User is already verified and active!');
      
      // Check subscription
      const subscription = await sql`
        SELECT id, plan_type, status
        FROM subscriptions 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (subscription.length > 0) {
        console.log(`✅ Subscription exists: ${subscription[0].plan_type} (${subscription[0].status})`);
      } else {
        console.log(`\n⚠️  No subscription found. Creating trial subscription...\n`);
        
        await sql`
          INSERT INTO subscriptions (
            user_id,
            plan_type,
            status,
            sessions_used,
            sessions_limit,
            minutes_used,
            minutes_limit,
            session_history
          ) VALUES (
            ${user.id},
            'free_trial',
            'trial',
            '0',
            '3',
            '0',
            '180',
            '[]'::jsonb
          )
        `;
        
        console.log('✅ Trial subscription created!');
      }
      
      return;
    }
    
    console.log('⚙️  Activating user account...\n');
    
    // Update user status
    await sql`
      UPDATE auth_users 
      SET 
        status = 'active',
        email_verified = true,
        updated_at = NOW()
      WHERE id = ${user.id}
    `;
    
    console.log('✅ User status updated to active');
    console.log('✅ Email marked as verified\n');
    
    // Create trial subscription
    console.log('⚙️  Creating trial subscription...\n');
    
    await sql`
      INSERT INTO subscriptions (
        user_id,
        plan_type,
        status,
        sessions_used,
        sessions_limit,
        minutes_used,
        minutes_limit,
        session_history
      ) VALUES (
        ${user.id},
        'free_trial',
        'trial',
        '0',
        '3',
        '0',
        '180',
        '[]'::jsonb
      )
    `;
    
    console.log('✅ Trial subscription created!');
    console.log('   - Plan: free_trial');
    console.log('   - Sessions: 0/3');
    console.log('   - Minutes: 0/180\n');
    
    console.log('🎉 User verification complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. User needs to login with their credentials');
    console.log('   2. Email: ' + email);
    console.log('   3. Password: (the password they set during registration)');
    console.log('   4. After login, profile page will load correctly\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

verifyUser();
