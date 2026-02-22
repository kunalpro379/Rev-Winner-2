import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createEntitlements() {
  try {
    const userId = '2cddba37-2b80-46f8-893f-a6622cce384c';
    
    console.log(`\n⚙️  Creating entitlements for user: ${userId}\n`);
    
    await sql`
      INSERT INTO user_entitlements (
        user_id,
        has_platform_access,
        session_minutes_balance,
        has_train_me,
        has_dai,
        is_enterprise_user
      ) VALUES (
        ${userId},
        true,
        180,
        false,
        false,
        false
      )
      ON CONFLICT (user_id) DO UPDATE SET
        has_platform_access = true,
        session_minutes_balance = 180,
        updated_at = NOW()
    `;
    
    console.log(`✅ Entitlements created/updated!\n`);
    
    // Verify
    const [entitlements] = await sql`
      SELECT *
      FROM user_entitlements 
      WHERE user_id = ${userId}
    `;
    
    console.log(`🎫 Current entitlements:`);
    console.log(`   Platform Access: ${entitlements.has_platform_access}`);
    console.log(`   Session Minutes Balance: ${entitlements.session_minutes_balance}`);
    console.log(`   Train Me: ${entitlements.has_train_me}`);
    console.log(`   DAI: ${entitlements.has_dai}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createEntitlements();
