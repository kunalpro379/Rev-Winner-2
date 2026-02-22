import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function resetTrial() {
  try {
    const userId = '2cddba37-2b80-46f8-893f-a6622cce384c';
    
    console.log(`\n⚙️  Resetting trial for user: ${userId}\n`);
    
    // Check current state
    const [before] = await sql`
      SELECT sessions_used, minutes_used
      FROM subscriptions 
      WHERE user_id = ${userId}
    `;
    
    console.log(`Before: Sessions ${before?.sessions_used || 0}, Minutes ${before?.minutes_used || 0}`);
    
    // Reset subscription
    const result = await sql`
      UPDATE subscriptions
      SET 
        sessions_used = '0',
        minutes_used = '0',
        sessions_limit = '3',
        minutes_limit = '180',
        status = 'trial'
      WHERE user_id = ${userId}
      RETURNING *
    `;
    
    console.log(`✅ Updated ${result.length} subscription(s)\n`);
    
    // Verify
    const [subscription] = await sql`
      SELECT id, plan_type, status, sessions_limit, minutes_limit, sessions_used, minutes_used
      FROM subscriptions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    if (subscription) {
      console.log(`💳 Updated Subscription:`);
      console.log(`   Plan: ${subscription.plan_type}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Sessions: ${subscription.sessions_used}/${subscription.sessions_limit}`);
      console.log(`   Minutes: ${subscription.minutes_used}/${subscription.minutes_limit}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

resetTrial();
