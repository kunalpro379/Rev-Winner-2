#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function checkTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n✅ Total tables in database: ${tables.length}\n`);
    
    console.log('📋 All tables:');
    tables.forEach((t, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${t.table_name}`);
    });
    
    console.log(`\n🎉 Database has ${tables.length} tables!\n`);
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
  }
}

checkTables();
