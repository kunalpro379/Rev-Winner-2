import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createBillingAdjustmentsTable() {
  console.log('🔧 Creating billing_adjustments table...\n');

  try {
    // Create billing_adjustments table
    await sql`
      CREATE TABLE IF NOT EXISTS billing_adjustments (
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
    console.log('✅ billing_adjustments table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_adjustments_org ON billing_adjustments(organization_id)`;
    console.log('✅ Index idx_billing_adjustments_org created');

    await sql`CREATE INDEX IF NOT EXISTS idx_billing_adjustments_package ON billing_adjustments(license_package_id)`;
    console.log('✅ Index idx_billing_adjustments_package created');

    await sql`CREATE INDEX IF NOT EXISTS idx_billing_adjustments_status ON billing_adjustments(status)`;
    console.log('✅ Index idx_billing_adjustments_status created');

    console.log('\n✅ billing_adjustments table setup complete!');

  } catch (error) {
    console.error('❌ Error creating billing_adjustments table:', error);
    process.exit(1);
  }
}

createBillingAdjustmentsTable();
