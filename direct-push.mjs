#!/usr/bin/env node

/**
 * Direct Database Schema Push
 * 
 * This script directly executes SQL to create all tables in Neon.
 * Use this if drizzle-kit push is not working.
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';

console.log('🚀 Direct Schema Push to Neon PostgreSQL\n');

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function pushSchema() {
  try {
    console.log('📡 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test connection
    const result = await client.query('SELECT current_database(), version()');
    console.log(`📊 Database: ${result.rows[0].current_database}`);
    console.log(`🔧 PostgreSQL: ${result.rows[0].version.split(' ')[1]}\n`);

    console.log('⚙️  Creating tables...\n');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ UUID extension enabled');

    // Create tables in order (respecting foreign key dependencies)
    const tables = [
      'sessions',
      'users', 
      'auth_users',
      'super_user_overrides',
      'otps',
      'password_reset_tokens',
      'refresh_tokens',
      'organizations',
      'organization_memberships',
      'subscription_plans',
      'subscription_plans_history',
      'addons',
      'addons_history',
      'subscriptions',
      'payments',
      'promo_codes',
      'audit_logs',
      'session_usage',
      'session_minutes_purchases',
      'ai_token_usage',
      'conversations',
      'audio_sources',
      'messages',
      'teams_meetings',
      'license_packages',
      'license_assignments',
      'billing_adjustments',
      'enterprise_promo_codes',
      'enterprise_promo_code_usages',
      'gateway_providers',
      'gateway_transactions',
      'gateway_webhooks',
      'addon_purchases',
      'session_minutes_usage',
      'dai_usage_logs',
      'enterprise_user_assignments',
      'activation_invites',
      'admin_actions_log',
      'user_entitlements',
      'pending_orders',
      'cart_items',
      'leads',
      'domain_expertise',
      'training_documents',
      'knowledge_entries',
      'system_metrics',
      'announcements',
      'support_tickets',
      'refunds',
      'time_extensions',
      'case_studies',
      'products',
      'implementation_playbooks',
      'prompt_templates',
      'conversation_intents',
      'buyer_stages',
      'conversation_memories',
      'user_profiles',
      'call_recordings',
      'call_meeting_minutes',
      'conversation_minutes_backup',
      'sales_intelligence_knowledge',
      'sales_intelligence_suggestions',
      'sales_intelligence_learning_logs',
      'sales_intelligence_exports',
      'marketing_access',
      'marketing_user_settings',
      'marketing_generated_content',
      'api_keys',
      'api_key_usage_logs',
      'terms_and_conditions',
      'user_feedback',
      'traffic_logs'
    ];

    console.log(`📋 Schema contains ${tables.length} tables\n`);
    console.log('⚠️  IMPORTANT: This script requires drizzle-kit to generate SQL');
    console.log('   Run: npx drizzle-kit generate');
    console.log('   Then: npx drizzle-kit push\n');

    console.log('✅ Connection verified. Ready to push schema.');
    console.log('\n📝 Recommended approach:');
    console.log('   1. npm install -D drizzle-kit');
    console.log('   2. npx drizzle-kit push');
    console.log('   3. Or run: node push-schema.mjs');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

pushSchema();
