import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkMyOrg() {
  try {
    console.log('\n🔍 Checking your organization status...\n');
    
    // Get your user ID (most recent user)
    const [myUser] = await sql`
      SELECT id, email, role, first_name, last_name
      FROM auth_users
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    console.log('👤 Your account:');
    console.log(`   Email: ${myUser.email}`);
    console.log(`   Role: ${myUser.role}`);
    console.log(`   User ID: ${myUser.id}`);
    
    // Check if you're a manager of any organization
    const orgs = await sql`
      SELECT id, company_name, primary_manager_id, created_at
      FROM organizations
      WHERE primary_manager_id = ${myUser.id}
    `;
    
    console.log('\n\n🏢 Organizations where you are the manager:');
    if (orgs.length === 0) {
      console.log('   ❌ None - You are NOT a manager of any organization');
    } else {
      orgs.forEach((org, index) => {
        console.log(`\n   ${index + 1}. ${org.company_name}`);
        console.log(`      Org ID: ${org.id}`);
        console.log(`      Created: ${new Date(org.created_at).toLocaleString()}`);
      });
    }
    
    // Check if you're a member of any organization
    const memberships = await sql`
      SELECT om.id, om.organization_id, om.role, om.status, o.company_name
      FROM organization_memberships om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = ${myUser.id}
    `;
    
    console.log('\n\n👥 Organization memberships:');
    if (memberships.length === 0) {
      console.log('   ❌ None - You are NOT a member of any organization');
    } else {
      memberships.forEach((membership, index) => {
        console.log(`\n   ${index + 1}. ${membership.company_name}`);
        console.log(`      Role: ${membership.role}`);
        console.log(`      Status: ${membership.status}`);
      });
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkMyOrg();
