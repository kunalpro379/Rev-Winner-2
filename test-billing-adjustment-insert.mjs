import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testInsert() {
  console.log('🧪 Testing billing_adjustments insert...\n');

  try {
    // First, get a test organization
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`;
    
    if (orgs.length === 0) {
      console.log('❌ No organizations found. Creating a test organization first...');
      return;
    }

    const orgId = orgs[0].id;
    console.log(`Using organization: ${orgId}`);

    // Try to insert a test billing adjustment
    const result = await sql`
      INSERT INTO billing_adjustments (
        organization_id,
        adjustment_type,
        delta_seats,
        amount,
        currency,
        status
      ) VALUES (
        ${orgId},
        'test_adjustment',
        5,
        '500.00',
        'USD',
        'pending'
      )
      RETURNING *
    `;

    console.log('\n✅ Insert successful!');
    console.log('Created adjustment:', result[0]);

    // Clean up test data
    await sql`DELETE FROM billing_adjustments WHERE adjustment_type = 'test_adjustment'`;
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    process.exit(1);
  }
}

testInsert();
