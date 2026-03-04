import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkMyRole() {
  try {
    console.log('\n🔍 Checking your user role...\n');
    
    // Get the most recent user (likely you)
    const users = await sql`
      SELECT id, email, role, first_name, last_name, created_at
      FROM auth_users
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('📋 Recent users:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name || ''} ${user.last_name || ''}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    });
    
    // Check for organizations
    console.log('\n\n🏢 Checking organizations...\n');
    const orgs = await sql`
      SELECT id, company_name, primary_manager_id, created_at
      FROM organizations
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    if (orgs.length === 0) {
      console.log('❌ No organizations found');
    } else {
      console.log('📋 Recent organizations:');
      orgs.forEach((org, index) => {
        console.log(`\n${index + 1}. ${org.company_name}`);
        console.log(`   Manager ID: ${org.primary_manager_id}`);
        console.log(`   Created: ${new Date(org.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkMyRole();
