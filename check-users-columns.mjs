import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkColumns() {
  try {
    console.log('\n=== CHECKING USERS TABLE ===');
    const users = await sql`SELECT * FROM users LIMIT 1`;
    if (users.length > 0) {
      console.log('Columns:', Object.keys(users[0]));
      console.log('Sample user:', users[0]);
    }
    
    console.log('\n=== ALL USERS WITH korenu EMAIL ===');
    const korenUsers = await sql`SELECT * FROM users WHERE email LIKE '%korenu%'`;
    console.log(korenUsers);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkColumns();
