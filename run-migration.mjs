import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add transcription_started_at field...');
    
    const migrationSQL = readFileSync('migrations/0002_add_transcription_started_at.sql', 'utf-8');
    
    // Split by semicolon and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      await sql(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column exists
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'transcription_started_at'
    `;
    
    if (result.length > 0) {
      console.log('✅ Verified: transcription_started_at column exists');
      console.log('   Type:', result[0].data_type);
    } else {
      console.log('❌ Warning: Column not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
