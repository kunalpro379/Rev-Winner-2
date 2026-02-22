import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixAudioSourcesConstraint() {
  try {
    console.log('\n⚙️  Fixing audio_sources source_type check constraint...\n');
    
    // First, check current constraint
    const constraints = await sql`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%audio_sources%source_type%'
    `;
    
    console.log('Current constraints:');
    constraints.forEach(c => {
      console.log(`  - ${c.constraint_name}: ${c.check_clause}`);
    });
    console.log('');
    
    // Drop the old constraint
    console.log('Dropping old constraint...');
    await sql`
      ALTER TABLE audio_sources 
      DROP CONSTRAINT IF EXISTS audio_sources_source_type_check
    `;
    console.log('✅ Old constraint dropped\n');
    
    // Add new constraint with correct values
    console.log('Adding new constraint with correct values...');
    await sql`
      ALTER TABLE audio_sources 
      ADD CONSTRAINT audio_sources_source_type_check 
      CHECK (source_type IN ('device-microphone', 'teams-meeting', 'teams-recording'))
    `;
    console.log('✅ New constraint added\n');
    
    // Verify new constraint
    const newConstraints = await sql`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'audio_sources_source_type_check'
    `;
    
    console.log('🎉 New constraint:');
    newConstraints.forEach(c => {
      console.log(`  - ${c.constraint_name}: ${c.check_clause}`);
    });
    console.log('');
    
    console.log('✅ audio_sources constraint fixed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

fixAudioSourcesConstraint();
