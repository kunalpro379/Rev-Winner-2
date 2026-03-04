import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkLicenseManagers() {
  try {
    console.log('\n=== ALL LICENSE MANAGERS ===');
    const managers = await sql`SELECT id, email, role FROM users WHERE role = 'license_manager'`;
    console.log(managers);
    
    for (const manager of managers) {
      console.log(`\n=== ORGANIZATION FOR ${manager.email} ===`);
      const orgs = await sql`SELECT * FROM organizations WHERE primary_manager_id = ${manager.id}`;
      console.log(orgs[0] || 'No organization found');
      
      if (orgs.length > 0) {
        console.log(`\n=== ADDONS FOR ${manager.email} ===`);
        const addons = await sql`SELECT * FROM organization_addons WHERE organization_id = ${orgs[0].id}`;
        console.log(addons);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLicenseManagers();
