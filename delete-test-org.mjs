import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function deleteTestOrg() {
  try {
    console.log('\n🗑️  Deleting test organization...\n');
    
    const orgId = '53ff2d0a-ee7a-47b1-b657-db1a8eb3aa66';
    const userId = 'fc736211-0236-4203-bf7b-42f830e2f625';
    
    // Delete organization memberships
    await sql`DELETE FROM organization_memberships WHERE organization_id = ${orgId}`;
    console.log('✅ Deleted organization memberships');
    
    // Delete license packages
    await sql`DELETE FROM license_packages WHERE organization_id = ${orgId}`;
    console.log('✅ Deleted license packages');
    
    // Delete organization
    await sql`DELETE FROM organizations WHERE id = ${orgId}`;
    console.log('✅ Deleted organization');
    
    // Reset user role to 'user'
    await sql`UPDATE auth_users SET role = 'user' WHERE id = ${userId}`;
    console.log('✅ Reset user role to "user"');
    
    console.log('\n✅ Test organization deleted successfully!\n');
    console.log('Now you can:');
    console.log('1. Log out and log back in');
    console.log('2. Go to /enterprise-purchase to create a proper enterprise organization');
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

deleteTestOrg();
