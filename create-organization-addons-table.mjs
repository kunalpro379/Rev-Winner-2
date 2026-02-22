import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createOrganizationAddonsTable() {
  console.log('🔧 Creating organization_addons table...\n');

  try {
    // Create organization_addons table
    await sql`
      CREATE TABLE IF NOT EXISTS organization_addons (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT false,
        purchase_amount VARCHAR,
        currency VARCHAR(10) DEFAULT 'INR',
        gateway_transaction_id VARCHAR,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ organization_addons table created');

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_org_addons_org 
      ON organization_addons(organization_id);
    `;
    console.log('✅ Index on organization_id created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_org_addons_type 
      ON organization_addons(type);
    `;
    console.log('✅ Index on type created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_org_addons_status 
      ON organization_addons(status);
    `;
    console.log('✅ Index on status created');

    console.log('\n✅ organization_addons table setup complete!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

createOrganizationAddonsTable().catch(console.error);
