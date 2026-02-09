#!/usr/bin/env node
import { db } from './server/db.ts';
import { passwordResetTokens, authUsers } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function testResetPassword() {
  try {
    console.log('Testing password reset flow...\n');
    
    // 1. Find a test user
    const [testUser] = await db.select().from(authUsers).limit(1);
    
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✓ Found test user: ${testUser.email}`);
    
    // 2. Create a password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    const [createdToken] = await db.insert(passwordResetTokens).values({
      email: testUser.email,
      token: resetToken,
      expiresAt,
      isUsed: false,
    }).returning();
    
    console.log(`✓ Created reset token: ${resetToken.substring(0, 20)}...`);
    console.log(`  Expires at: ${expiresAt.toISOString()}`);
    
    // 3. Test the API endpoint
    const testPassword = 'NewPassword123!';
    const apiUrl = process.env.REPLIT_DOMAIN 
      ? `https://${process.env.REPLIT_DOMAIN}/api/auth/reset-password`
      : 'http://localhost:5000/api/auth/reset-password';
    
    console.log(`\n Testing API endpoint: ${apiUrl}`);
    console.log(`  Request body: { token: "${resetToken.substring(0, 20)}...", password: "${testPassword}" }`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        password: testPassword,
      }),
    });
    
    const responseData = await response.json();
    
    console.log(`\n Response status: ${response.status}`);
    console.log(`  Response body:`, responseData);
    
    if (response.ok) {
      console.log('\n✓ Password reset successful!');
      console.log(`\nTest reset link: ${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'http://localhost:5000'}/reset-password?token=${resetToken}`);
    } else {
      console.log('\n❌ Password reset failed');
    }
    
    // 4. Verify token was marked as used
    const [updatedToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.id, createdToken.id));
    console.log(`\n Token status after reset:`);
    console.log(`  isUsed: ${updatedToken.isUsed}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testResetPassword();
