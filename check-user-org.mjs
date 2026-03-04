import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkUserOrg() {
  try {
    const email = 'korenu@fxzig.com';
    
    console.log('\n=== USER DATA ===');
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    console.log(users[0]);
    
    if (users.length > 0) {
      const userId = users[0].id;
      
      console.log('\n=== ORGANIZATION DATA ===');
      const orgs = await sql`SELECT * FROM organizations WHERE primary_manager_id = ${userId}`;
      console.log(orgs[0] || 'No organization found');
      
      if (orgs.length > 0) {
        console.log('\n=== ORGANIZATION ADDONS ===');
        const addons = await sql`SELECT * FROM organization_addons WHERE organization_id = ${orgs[0].id}`;
        console.log(addons);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserOrg();
