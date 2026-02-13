import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add user_feedback table...');
    
    const migrationSQL = readFileSync('migrations/0003_add_user_feedback.sql', 'utf-8');
    
    // Split by semicolon and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        await sql(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the table exists
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_feedback'
    `;
    
    if (result.length > 0) {
      console.log('✅ Verified: user_feedback table exists');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_feedback'
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Warning: Table not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
