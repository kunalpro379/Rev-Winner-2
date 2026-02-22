#!/usr/bin/env node

/**
 * Create Missing Tables
 * Creates gateway_providers and conversation_minutes_backup tables
 */

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function createMissingTables() {
  try {
    console.log('🔨 Creating missing tables...\n');
    
    // 1. Gateway Providers table
    console.log('⏳ Creating gateway_providers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gateway_providers (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        provider_name VARCHAR(50) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        configuration JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ gateway_providers created\n');
    
    // 2. Conversation Minutes Backup table
    console.log('⏳ Creating conversation_minutes_backup table...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_minutes_backup (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        user_id VARCHAR(255) REFERENCES auth_users(id) ON DELETE CASCADE,
        client_name TEXT,
        company_name TEXT,
        industry TEXT,
        meeting_date TIMESTAMP,
        meeting_duration_minutes INTEGER,
        executive_summary TEXT,
        key_topics_discussed JSONB DEFAULT '[]',
        client_pain_points JSONB DEFAULT '[]',
        client_requirements JSONB DEFAULT '[]',
        solutions_proposed JSONB DEFAULT '[]',
        competitors_discussed JSONB DEFAULT '[]',
        objections JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        next_steps JSONB DEFAULT '[]',
        full_transcript TEXT,
        message_count INTEGER DEFAULT 0,
        key_quotes JSONB DEFAULT '[]',
        marketing_hooks JSONB DEFAULT '[]',
        best_practices JSONB DEFAULT '[]',
        challenges_identified JSONB DEFAULT '[]',
        success_indicators JSONB DEFAULT '[]',
        raw_minutes_data JSONB DEFAULT '{}',
        discovery_insights JSONB DEFAULT '{}',
        backup_status TEXT DEFAULT 'pending',
        backup_source TEXT DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ conversation_minutes_backup created\n');
    
    // 3. Gateway Transactions table
    console.log('⏳ Creating gateway_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gateway_transactions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        provider_id VARCHAR(255) REFERENCES gateway_providers(id) NOT NULL,
        provider_transaction_id VARCHAR(255),
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        user_id VARCHAR(255) REFERENCES auth_users(id),
        organization_id VARCHAR(255) REFERENCES organizations(id),
        related_entity VARCHAR(50),
        related_entity_id VARCHAR(255),
        payload JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ gateway_transactions created\n');
    
    // 4. Gateway Webhooks table
    console.log('⏳ Creating gateway_webhooks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gateway_webhooks (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        provider_id VARCHAR(255) REFERENCES gateway_providers(id) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        signature TEXT,
        verified BOOLEAN DEFAULT false,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ gateway_webhooks created\n');
    
    // Create indexes
    console.log('🔨 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_gateway_transactions_user ON gateway_transactions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gateway_transactions_org ON gateway_transactions(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gateway_webhooks_provider ON gateway_webhooks(provider_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_minutes_backup_conversation ON conversation_minutes_backup(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_minutes_backup_user ON conversation_minutes_backup(user_id)`;
    console.log('✅ Indexes created\n');
    
    // Insert default gateway provider (Razorpay)
    console.log('⏳ Inserting default Razorpay provider...');
    await sql`
      INSERT INTO gateway_providers (provider_name, is_active, is_default, configuration)
      VALUES ('razorpay', true, true, '{"mode": "test"}')
      ON CONFLICT (provider_name) DO NOTHING
    `;
    console.log('✅ Default provider inserted\n');
    
    // Check final table count
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('=' .repeat(60));
    console.log(`\n✅ SUCCESS! Database now has ${tables.length} tables\n`);
    
    console.log('📋 New tables created:');
    console.log('   1. gateway_providers');
    console.log('   2. gateway_transactions');
    console.log('   3. gateway_webhooks');
    console.log('   4. conversation_minutes_backup\n');
    
    console.log('🎉 All missing tables created successfully!');
    console.log('\n🚀 Server should now start without errors\n');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

createMissingTables();
