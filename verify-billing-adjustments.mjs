import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function verifyBillingAdjustments() {
  console.log('🔍 Verifying billing_adjustments table...\n');

  try {
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'billing_adjustments'
      );
    `;
    
    console.log('Table exists:', tableCheck[0].exists);

    if (tableCheck[0].exists) {
      // Get table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'billing_adjustments'
        ORDER BY ordinal_position;
      `;
      
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Get indexes
      const indexes = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'billing_adjustments';
      `;
      
      console.log('\n📊 Indexes:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });

      // Try a test query
      console.log('\n🧪 Testing query...');
      const testQuery = await sql`SELECT COUNT(*) as count FROM billing_adjustments`;
      console.log(`✅ Query successful! Row count: ${testQuery[0].count}`);
    } else {
      console.log('❌ Table does not exist! Running creation script...');
      
      // Create the table
      await sql`
        CREATE TABLE billing_adjustments (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id VARCHAR NOT NULL REFERENCES organizations(id),
          license_package_id VARCHAR REFERENCES license_packages(id),
          adjustment_type VARCHAR(50) NOT NULL,
          delta_seats INTEGER NOT NULL,
          razorpay_order_id VARCHAR(255),
          razorpay_payment_id VARCHAR(255),
          amount VARCHAR(20) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'USD',
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          processed_at TIMESTAMP,
          added_by VARCHAR REFERENCES auth_users(id),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('✅ Table created');

      // Create indexes
      await sql`CREATE INDEX idx_billing_adjustments_org ON billing_adjustments(organization_id)`;
      await sql`CREATE INDEX idx_billing_adjustments_package ON billing_adjustments(license_package_id)`;
      await sql`CREATE INDEX idx_billing_adjustments_status ON billing_adjustments(status)`;
      console.log('✅ Indexes created');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyBillingAdjustments();
