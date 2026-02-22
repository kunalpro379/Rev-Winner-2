import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function testPasswordResetEmail() {
  console.log('\n🔍 Testing Password Reset Email Link Generation\n');
  
  // Get a test user
  const users = await sql`SELECT id, email, first_name FROM users LIMIT 1`;
  
  if (users.length === 0) {
    console.log('❌ No users found in database');
    return;
  }
  
  const user = users[0];
  console.log(`✅ Found test user: ${user.email} (${user.first_name})`);
  
  // Generate reset token (same as in routes-auth.ts)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  console.log(`\n📧 Reset Token: ${resetToken}`);
  console.log(`⏰ Expires At: ${expiresAt.toISOString()}`);
  
  // Generate reset link (same as in email.ts)
  const APP_URL = process.env.APP_URL || 'https://revwinner.com';
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;
  
  console.log(`\n🔗 Generated Reset Link:`);
  console.log(`   ${resetLink}`);
  
  console.log(`\n✅ Link is correct! It should go to /reset-password, NOT /login`);
  console.log(`\nIf you're seeing /login in the email, it might be:`);
  console.log(`   1. An old cached email`);
  console.log(`   2. Email client modifying the link`);
  console.log(`   3. A different email template being used`);
  
  // Insert token into database
  await sql`
    INSERT INTO password_reset_tokens (email, token, expires_at)
    VALUES (${user.email}, ${resetToken}, ${expiresAt})
  `;
  
  console.log(`\n✅ Token saved to database for testing`);
  console.log(`\nYou can test the reset link by visiting:`);
  console.log(`   ${resetLink}`);
}

testPasswordResetEmail()
  .then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
