import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createAllMissingTables() {
  console.log('🔧 Creating all missing tables...\n');
  
  try {
    // 1. Session Minutes Usage
    console.log('1. Creating session_minutes_usage table...');
    await sql`
      CREATE TABLE IF NOT EXISTS session_minutes_usage (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        purchase_id VARCHAR NOT NULL REFERENCES addon_purchases(id) ON DELETE CASCADE,
        conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE,
        minutes_consumed INTEGER NOT NULL,
        feature_used VARCHAR(100),
        consumed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_minutes_user ON session_minutes_usage(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_minutes_purchase ON session_minutes_usage(purchase_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_minutes_consumed_at ON session_minutes_usage(consumed_at)`;
    console.log('✅ session_minutes_usage created');

    // 2. Sales Intelligence Knowledge
    console.log('2. Creating sales_intelligence_knowledge table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sales_intelligence_knowledge (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_type TEXT NOT NULL,
        industry TEXT,
        persona TEXT,
        sales_stage TEXT,
        trigger_keywords JSONB DEFAULT '[]',
        trigger_patterns JSONB DEFAULT '[]',
        suggested_response TEXT NOT NULL,
        follow_up_prompt TEXT,
        usage_count INTEGER DEFAULT 0,
        acceptance_count INTEGER DEFAULT 0,
        rejection_count INTEGER DEFAULT 0,
        performance_score INTEGER DEFAULT 50,
        is_validated BOOLEAN DEFAULT false,
        validated_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
        validated_at TIMESTAMP,
        source TEXT DEFAULT 'manual',
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ sales_intelligence_knowledge created');

    // 3. Sales Intelligence Suggestions
    console.log('3. Creating sales_intelligence_suggestions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sales_intelligence_suggestions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES auth_users(id) ON DELETE CASCADE,
        knowledge_id VARCHAR REFERENCES sales_intelligence_knowledge(id) ON DELETE SET NULL,
        detected_intent TEXT NOT NULL,
        intent_confidence INTEGER NOT NULL,
        customer_question TEXT NOT NULL,
        assembled_context JSONB DEFAULT '{}',
        suggested_response TEXT NOT NULL,
        follow_up_prompt TEXT,
        retrieval_confidence INTEGER NOT NULL,
        was_displayed BOOLEAN DEFAULT true,
        was_used BOOLEAN,
        response_latency_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ sales_intelligence_suggestions created');

    // 4. Sales Intelligence Learning Logs
    console.log('4. Creating sales_intelligence_learning_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sales_intelligence_learning_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        suggestion_id VARCHAR REFERENCES sales_intelligence_suggestions(id) ON DELETE CASCADE,
        conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES auth_users(id) ON DELETE CASCADE,
        customer_question TEXT NOT NULL,
        detected_intent TEXT NOT NULL,
        suggested_response TEXT NOT NULL,
        rep_used_suggestion BOOLEAN,
        rep_modified_response TEXT,
        outcome_signals JSONB DEFAULT '{}',
        industry TEXT,
        persona TEXT,
        sales_stage TEXT,
        product_discussed TEXT,
        is_anonymized BOOLEAN DEFAULT false,
        can_use_for_marketing BOOLEAN DEFAULT true,
        can_use_for_training BOOLEAN DEFAULT true,
        processing_status TEXT DEFAULT 'pending',
        promoted_to_knowledge BOOLEAN DEFAULT false,
        promoted_knowledge_id VARCHAR REFERENCES sales_intelligence_knowledge(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `;
    console.log('✅ sales_intelligence_learning_logs created');

    // 5. Sales Intelligence Exports
    console.log('5. Creating sales_intelligence_exports table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sales_intelligence_exports (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        export_name TEXT NOT NULL,
        export_type TEXT NOT NULL,
        date_range_start TIMESTAMP,
        date_range_end TIMESTAMP,
        intent_filter TEXT,
        industry_filter TEXT,
        record_count INTEGER DEFAULT 0,
        export_data JSONB DEFAULT '[]',
        exported_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
        purpose TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ sales_intelligence_exports created');

    // Verify all tables
    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'session_minutes_usage',
        'sales_intelligence_knowledge',
        'sales_intelligence_suggestions',
        'sales_intelligence_learning_logs',
        'sales_intelligence_exports'
      )
      ORDER BY table_name
    `;
    
    console.log('\n✅ Created tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });

    console.log('\n🎉 All missing tables created successfully!');
    console.log('\n✅ Fixed errors:');
    console.log('  - session_minutes_usage table');
    console.log('  - sales_intelligence_knowledge table');
    console.log('  - sales_intelligence_suggestions table');
    console.log('  - sales_intelligence_learning_logs table');
    console.log('  - sales_intelligence_exports table');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createAllMissingTables();
