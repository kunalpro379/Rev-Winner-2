import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function createPasswordResetTable() {
  console.log('\n🔧 Creating password_reset_tokens table...\n');
  
  try {
    // Create password_reset_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ password_reset_tokens table created');
    
    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
      ON password_reset_tokens(email)
    `;
    
    console.log('✅ Index on email created');
    
    // Create index on token for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
      ON password_reset_tokens(token)
    `;
    
    console.log('✅ Index on token created');
    
    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'password_reset_tokens'
    `;
    
    if (tables.length > 0) {
      console.log('\n✅ Table verified in database');
      
      // Show table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }
    
    console.log('\n✅ Password reset table setup complete!\n');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

createPasswordResetTable()
  .then(() => {
    console.log('✅ Migration completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
