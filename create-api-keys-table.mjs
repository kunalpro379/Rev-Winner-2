import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createApiKeysTables() {
  console.log('🔧 Creating API Keys tables...\n');
  
  try {
    // Create api_keys table
    console.log('Creating api_keys table...');
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(10) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        created_by VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        organization_id VARCHAR REFERENCES organizations(id) ON DELETE SET NULL,
        scopes TEXT[] DEFAULT '{}',
        rate_limit INTEGER DEFAULT 1000,
        rate_limit_window VARCHAR(20) DEFAULT 'hour',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        last_used_at TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        ip_whitelist TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        revoked_at TIMESTAMP,
        revoked_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ api_keys table created');

    // Create api_key_usage_logs table
    console.log('Creating api_key_usage_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS api_key_usage_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id VARCHAR NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER,
        response_time INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_body JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ api_key_usage_logs table created');

    // Create indexes for better performance
    console.log('Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at)
    `;
    console.log('✅ Indexes created');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('api_keys', 'api_key_usage_logs')
      ORDER BY table_name
    `;
    
    console.log('\nCreated tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });

    // Check columns
    const columns = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('api_keys', 'api_key_usage_logs')
      ORDER BY table_name, ordinal_position
    `;

    console.log('\n📋 Table Structure:');
    let currentTable = '';
    columns.forEach(col => {
      if (col.table_name !== currentTable) {
        currentTable = col.table_name;
        console.log(`\n${currentTable}:`);
      }
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n✅ API Keys tables created successfully!');
    console.log('\n🎉 You can now use API Keys management in the admin panel!');

  } catch (error) {
    console.error('❌ Error creating API Keys tables:', error);
    process.exit(1);
  }
}

createApiKeysTables();
