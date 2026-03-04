import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkUserRoles() {
  try {
    console.log('\n=== CHECKING USER_ROLES TABLE ===');
    const roles = await sql`SELECT * FROM user_roles LIMIT 5`;
    console.log(roles);
    
    console.log('\n=== LICENSE MANAGERS ===');
    const managers = await sql`SELECT * FROM user_roles WHERE role = 'license_manager'`;
    console.log(managers);
    
    if (managers.length > 0) {
      for (const manager of managers) {
        console.log(`\n=== USER ${manager.user_id} ===`);
        const user = await sql`SELECT * FROM users WHERE id = ${manager.user_id}`;
        console.log(user[0]);
        
        console.log(`\n=== ORGANIZATION FOR ${manager.user_id} ===`);
        const orgs = await sql`SELECT * FROM organizations WHERE primary_manager_id = ${manager.user_id}`;
        console.log(orgs[0] || 'No organization');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserRoles();
