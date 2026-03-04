import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('\n=== ALL TABLES ===');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(tables.map(t => t.table_name));
    
    console.log('\n=== CHECKING auth_users TABLE ===');
    const authUsers = await sql`SELECT * FROM auth_users WHERE email LIKE '%korenu%'`;
    console.log(authUsers);
    
    if (authUsers.length > 0) {
      const userId = authUsers[0].id;
      console.log(`\n=== ORGANIZATION FOR USER ${userId} ===`);
      const orgs = await sql`SELECT * FROM organizations WHERE primary_manager_id = ${userId}`;
      console.log(orgs);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
