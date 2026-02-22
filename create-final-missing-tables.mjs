import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createFinalMissingTables() {
  console.log('🔧 Creating final missing tables...\n');
  
  try {
    // 1. User Entitlements
    console.log('1. Creating user_entitlements table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_entitlements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        organization_id VARCHAR REFERENCES organizations(id) ON DELETE SET NULL,
        has_platform_access BOOLEAN DEFAULT false,
        platform_access_expires_at TIMESTAMP,
        session_minutes_balance INTEGER DEFAULT 0,
        session_minutes_expires_at TIMESTAMP,
        has_train_me BOOLEAN DEFAULT false,
        train_me_expires_at TIMESTAMP,
        has_dai BOOLEAN DEFAULT false,
        dai_tokens_balance INTEGER DEFAULT 0,
        dai_expires_at TIMESTAMP,
        is_enterprise_user BOOLEAN DEFAULT false,
        enterprise_train_me_enabled BOOLEAN DEFAULT false,
        enterprise_dai_enabled BOOLEAN DEFAULT false,
        last_calculated_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON user_entitlements(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_entitlements_org ON user_entitlements(organization_id)`;
    console.log('✅ user_entitlements created');

    // 2. Call Recordings
    console.log('2. Creating call_recordings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS call_recordings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        duration INTEGER,
        recording_url TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_user ON call_recordings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_expires ON call_recordings(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recordings_status ON call_recordings(status)`;
    console.log('✅ call_recordings created');

    // 3. Call Meeting Minutes
    console.log('3. Creating call_meeting_minutes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS call_meeting_minutes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE,
        recording_id VARCHAR REFERENCES call_recordings(id) ON DELETE SET NULL,
        title VARCHAR(255),
        summary TEXT,
        key_points JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        participants JSONB DEFAULT '[]',
        pain_points JSONB DEFAULT '[]',
        recommendations JSONB DEFAULT '[]',
        next_steps JSONB DEFAULT '[]',
        full_transcript TEXT,
        structured_minutes JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_minutes_user ON call_meeting_minutes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_minutes_recording ON call_meeting_minutes(recording_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_minutes_expires ON call_meeting_minutes(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_minutes_status ON call_meeting_minutes(status)`;
    console.log('✅ call_meeting_minutes created');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'user_entitlements',
        'call_recordings',
        'call_meeting_minutes'
      )
      ORDER BY table_name
    `;
    
    console.log('\n✅ Created tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });

    console.log('\n🎉 All final missing tables created successfully!');
    console.log('\n✅ Fixed errors:');
    console.log('  - user_entitlements table (for subscription limits)');
    console.log('  - call_recordings table (for audio storage)');
    console.log('  - call_meeting_minutes table (for AI meeting summaries)');
    console.log('\n✅ No more "relation does not exist" errors!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createFinalMissingTables();
