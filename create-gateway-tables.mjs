import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

console.log('🔧 Creating missing gateway and backup tables...\n');

async function createTables() {
  try {
    // Create gateway_providers table
    console.log('Creating gateway_providers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gateway_providers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_name VARCHAR(50) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        configuration JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ gateway_providers table created');

    // Insert default Razorpay provider
    console.log('\nInserting default Razorpay provider...');
    await sql`
      INSERT INTO gateway_providers (provider_name, is_active, is_default, configuration)
      VALUES ('razorpay', true, true, '{}'::jsonb)
      ON CONFLICT (provider_name) DO UPDATE SET
        is_active = true,
        is_default = true,
        updated_at = NOW()
    `;
    console.log('✓ Razorpay provider configured');

    // Create conversation_minutes_backup table
    console.log('\nCreating conversation_minutes_backup table...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_minutes_backup (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR NOT NULL,
        user_id VARCHAR,
        client_name TEXT,
        company_name TEXT,
        industry TEXT,
        meeting_date TIMESTAMP,
        meeting_duration_minutes INTEGER,
        executive_summary TEXT,
        key_topics_discussed JSONB DEFAULT '[]'::jsonb,
        client_pain_points JSONB DEFAULT '[]'::jsonb,
        client_requirements JSONB DEFAULT '[]'::jsonb,
        solutions_proposed JSONB DEFAULT '[]'::jsonb,
        competitors_discussed JSONB DEFAULT '[]'::jsonb,
        objections JSONB DEFAULT '[]'::jsonb,
        action_items JSONB DEFAULT '[]'::jsonb,
        next_steps JSONB DEFAULT '[]'::jsonb,
        full_transcript TEXT,
        message_count INTEGER DEFAULT 0,
        key_quotes JSONB DEFAULT '[]'::jsonb,
        marketing_hooks JSONB DEFAULT '[]'::jsonb,
        best_practices JSONB DEFAULT '[]'::jsonb,
        challenges_identified JSONB DEFAULT '[]'::jsonb,
        success_indicators JSONB DEFAULT '[]'::jsonb,
        raw_minutes_data JSONB DEFAULT '{}'::jsonb,
        discovery_insights JSONB DEFAULT '{}'::jsonb,
        backup_status TEXT DEFAULT 'pending',
        backup_source TEXT DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ conversation_minutes_backup table created');

    console.log('\n✅ All missing tables created successfully!\n');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
