import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixAudioSourcesTable() {
  try {
    console.log('\n⚙️  Adding missing columns to audio_sources table...\n');
    
    // Add source_id column
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS source_id TEXT
    `;
    console.log('✅ Added source_id column');
    
    // Add teams_meeting_id column (without FK constraint since teams_meetings table may not exist)
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS teams_meeting_id VARCHAR
    `;
    console.log('✅ Added teams_meeting_id column');
    
    // Add status column
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disconnected'))
    `;
    console.log('✅ Added status column');
    
    // Add metadata column
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'
    `;
    console.log('✅ Added metadata column');
    
    // Add connected_at column
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP DEFAULT NOW()
    `;
    console.log('✅ Added connected_at column');
    
    // Add disconnected_at column
    await sql`
      ALTER TABLE audio_sources 
      ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMP
    `;
    console.log('✅ Added disconnected_at column\n');
    
    // Remove old columns that don't match schema
    try {
      await sql`ALTER TABLE audio_sources DROP COLUMN IF EXISTS device_label`;
      console.log('✅ Removed device_label column');
    } catch (e) {
      console.log('⚠️  device_label column not found (ok)');
    }
    
    try {
      await sql`ALTER TABLE audio_sources DROP COLUMN IF EXISTS is_primary`;
      console.log('✅ Removed is_primary column');
    } catch (e) {
      console.log('⚠️  is_primary column not found (ok)');
    }
    
    console.log('');
    
    // Verify columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audio_sources'
      ORDER BY ordinal_position
    `;
    
    console.log('🎉 audio_sources table structure:\n');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

fixAudioSourcesTable();
