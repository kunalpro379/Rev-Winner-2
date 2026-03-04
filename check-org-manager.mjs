import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkOrgManager() {
  try {
    console.log('\n🔍 Checking organization manager details...\n');
    
    const orgManagerId = 'fc736211-0236-4203-bf7b-42f830e2f625';
    
    // Get the user details for this manager ID
    const [manager] = await sql`
      SELECT id, email, role, first_name, last_name, created_at
      FROM auth_users
      WHERE id = ${orgManagerId}
    `;
    
    if (!manager) {
      console.log('❌ No user found with that ID');
      return;
    }
    
    console.log('👤 Organization Manager:');
    console.log(`   Name: ${manager.first_name} ${manager.last_name}`);
    console.log(`   Email: ${manager.email}`);
    console.log(`   Role: ${manager.role}`);
    console.log(`   User ID: ${manager.id}`);
    console.log(`   Created: ${new Date(manager.created_at).toLocaleString()}`);
    
    // Get the organization
    const [org] = await sql`
      SELECT id, company_name, billing_email, created_at
      FROM organizations
      WHERE primary_manager_id = ${orgManagerId}
    `;
    
    if (org) {
      console.log('\n🏢 Their Organization:');
      console.log(`   Company: ${org.company_name}`);
      console.log(`   Billing Email: ${org.billing_email}`);
      console.log(`   Created: ${new Date(org.created_at).toLocaleString()}`);
    }
    
    // Get your current user
    const [currentUser] = await sql`
      SELECT id, email, role, first_name, last_name
      FROM auth_users
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    console.log('\n\n👤 Your Current Account:');
    console.log(`   Name: ${currentUser.first_name} ${currentUser.last_name}`);
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   Role: ${currentUser.role}`);
    console.log(`   User ID: ${currentUser.id}`);
    
    if (currentUser.id === orgManagerId) {
      console.log('\n⚠️  YOU ARE THE MANAGER OF THIS ORGANIZATION!');
    } else {
      console.log('\n✅ You are NOT the manager of this organization');
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkOrgManager();
