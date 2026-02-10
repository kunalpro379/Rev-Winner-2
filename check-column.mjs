import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkColumn() {
  try {
    // Check if column exists
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Conversations table columns:');
    result.forEach(col => {
      const marker = col.column_name === 'transcription_started_at' ? '✅' : '  ';
      console.log(`${marker} ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    const hasColumn = result.some(col => col.column_name === 'transcription_started_at');
    
    if (hasColumn) {
      console.log('\n✅ transcription_started_at column EXISTS');
    } else {
      console.log('\n❌ transcription_started_at column MISSING');
      console.log('Attempting to add it now...');
      
      await sql`ALTER TABLE conversations ADD COLUMN transcription_started_at TIMESTAMP`;
      console.log('✅ Column added');
      
      await sql`CREATE INDEX IF NOT EXISTS idx_conversations_transcription_started ON conversations(transcription_started_at)`;
      console.log('✅ Index created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkColumn();
