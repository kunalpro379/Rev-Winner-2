import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createEnterpriseTables() {
  try {
    console.log('\n⚙️  Creating enterprise_user_assignments table...\n');
    
    await sql`
      CREATE TABLE IF NOT EXISTS enterprise_user_assignments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        license_package_id VARCHAR NOT NULL REFERENCES license_packages(id) ON DELETE CASCADE,
        assigned_by VARCHAR REFERENCES auth_users(id),
        assigned_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
        train_me_enabled BOOLEAN DEFAULT false,
        dai_enabled BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, license_package_id)
      )
    `;
    
    console.log('✅ enterprise_user_assignments table created!\n');
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enterprise_assignments_user 
      ON enterprise_user_assignments(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enterprise_assignments_license 
      ON enterprise_user_assignments(license_package_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enterprise_assignments_status 
      ON enterprise_user_assignments(status)
    `;
    
    console.log('✅ Indexes created!\n');
    
    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'enterprise_user_assignments'
    `;
    
    if (tables.length > 0) {
      console.log('🎉 enterprise_user_assignments table verified!\n');
      
      // Show columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'enterprise_user_assignments'
        ORDER BY ordinal_position
      `;
      
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createEnterpriseTables();
