import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkResetToken() {
  try {
    console.log('\n🔍 Checking password reset tokens...\n');
    
    const token = 'bcd55adf6c65460bf52c113657bc12073956e0f6ff2a3a5d7bd935b93d3a89aa';
    
    // Check if token exists
    const [tokenRecord] = await sql`
      SELECT email, expires_at, is_used, created_at
      FROM password_reset_tokens
      WHERE token = ${token}
    `;
    
    if (!tokenRecord) {
      console.log('❌ Token not found in database');
      
      // Show recent tokens
      const recentTokens = await sql`
        SELECT email, token, expires_at, is_used, created_at
        FROM password_reset_tokens
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      console.log('\n📋 Recent password reset tokens:');
      recentTokens.forEach((t, index) => {
        const now = new Date();
        const expiresAt = new Date(t.expires_at);
        const isExpired = now > expiresAt;
        const isUsed = !!t.is_used;
        
        console.log(`\n${index + 1}. Email: ${t.email}`);
        console.log(`   Token: ${t.token.substring(0, 20)}...`);
        console.log(`   Created: ${new Date(t.created_at).toLocaleString()}`);
        console.log(`   Expires: ${expiresAt.toLocaleString()}`);
        console.log(`   Status: ${isUsed ? '❌ Used' : isExpired ? '❌ Expired' : '✅ Valid'}`);
      });
      
      return;
    }
    
    console.log('✅ Token found!');
    console.log(`   Email: ${tokenRecord.email}`);
    console.log(`   Created: ${new Date(tokenRecord.created_at).toLocaleString()}`);
    console.log(`   Expires: ${new Date(tokenRecord.expires_at).toLocaleString()}`);
    
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    const isExpired = now > expiresAt;
    const isUsed = !!tokenRecord.is_used;
    
    if (isUsed) {
      console.log(`   ❌ Status: Already used`);
    } else if (isExpired) {
      console.log(`   ❌ Status: Expired (${Math.round((now - expiresAt) / 1000 / 60)} minutes ago)`);
    } else {
      console.log(`   ✅ Status: Valid (expires in ${Math.round((expiresAt - now) / 1000 / 60)} minutes)`);
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkResetToken();
