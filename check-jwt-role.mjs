import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkJwtRole() {
  try {
    console.log('\n🔍 Checking JWT role for korenu@fxzig.com...\n');
    
    const userId = 'fc736211-0236-4203-bf7b-42f830e2f625';
    
    // Get the user details
    const [user] = await sql`
      SELECT id, email, role, first_name, last_name, status, session_version
      FROM auth_users
      WHERE id = ${userId}
    `;
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Details:');
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Session Version: ${user.session_version}`);
    
    // Check if they have an organization
    const [org] = await sql`
      SELECT id, company_name, billing_email
      FROM organizations
      WHERE primary_manager_id = ${userId}
    `;
    
    if (org) {
      console.log('\n🏢 Organization:');
      console.log(`   Company: ${org.company_name}`);
      console.log(`   Billing Email: ${org.billing_email}`);
      console.log(`   Org ID: ${org.id}`);
    } else {
      console.log('\n❌ No organization found');
    }
    
    // Check for super user override
    const [superUser] = await sql`
      SELECT email, reason, is_active
      FROM super_user_overrides
      WHERE email = ${user.email}
    `;
    
    if (superUser) {
      console.log('\n⭐ Super User Override:');
      console.log(`   Active: ${superUser.is_active}`);
      console.log(`   Reason: ${superUser.reason}`);
    }
    
    console.log('\n\n📋 Summary:');
    console.log(`   ✅ Role is: ${user.role}`);
    console.log(`   ${user.role === 'license_manager' ? '✅' : '❌'} Should have License Manager access`);
    console.log(`   ${org ? '✅' : '❌'} Has organization`);
    
    if (user.role === 'license_manager' && org) {
      console.log('\n✅ This user SHOULD be able to access License Manager!');
      console.log('   If getting 403 error, try:');
      console.log('   1. Log out and log back in (to refresh JWT token)');
      console.log('   2. Clear browser cache');
      console.log('   3. Check browser console for errors');
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkJwtRole();
