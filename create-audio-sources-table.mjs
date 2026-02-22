import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createAudioSourcesTable() {
  try {
    console.log('\n⚙️  Creating audio_sources table...\n');
    
    await sql`
      CREATE TABLE IF NOT EXISTS audio_sources (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        source_type VARCHAR NOT NULL CHECK (source_type IN ('microphone', 'tab', 'system')),
        device_label VARCHAR,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ audio_sources table created!\n');
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audio_sources_conversation 
      ON audio_sources(conversation_id)
    `;
    
    console.log('✅ Index created on conversation_id\n');
    
    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'audio_sources'
    `;
    
    if (tables.length > 0) {
      console.log('🎉 audio_sources table verified!\n');
      
      // Show columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'audio_sources'
        ORDER BY ordinal_position
      `;
      
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createAudioSourcesTable();
