#!/usr/bin/env node

/**
 * Direct Table Creation Script
 * Creates all tables directly using SQL
 */

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found!');
  process.exit(1);
}

console.log('🚀 Direct Table Creation Script\n');

const sql = postgres(DATABASE_URL, { 
  max: 1,
  ssl: 'require'
});

async function checkAndCreateTables() {
  try {
    // Check current tables
    console.log('📊 Checking current tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`✅ Found ${tables.length} existing tables\n`);
    
    if (tables.length > 0) {
      console.log('📋 Existing tables:');
      tables.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.table_name}`);
      });
      console.log();
    }
    
    // Create essential tables first
    console.log('🔨 Creating essential tables...\n');
    
    // 1. Auth Users table (most important)
    console.log('⏳ Creating auth_users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        organization VARCHAR(255),
        username VARCHAR(100) NOT NULL UNIQUE,
        hashed_password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        trial_start_date TIMESTAMP,
        trial_end_date TIMESTAMP,
        train_me_subscription_date TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        stripe_customer_id VARCHAR(255),
        ai_engine VARCHAR(50),
        encrypted_api_key TEXT,
        ai_engine_setup_completed BOOLEAN DEFAULT false,
        terms_accepted BOOLEAN DEFAULT false,
        terms_accepted_at TIMESTAMP,
        session_version INTEGER NOT NULL DEFAULT 0,
        call_recording_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ auth_users created\n');
    
    // 2. Conversations table
    console.log('⏳ Creating conversations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_id TEXT NOT NULL,
        user_id VARCHAR(255) REFERENCES auth_users(id) ON DELETE CASCADE,
        client_name TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        discovery_insights JSONB DEFAULT '{}',
        call_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        transcription_started_at TIMESTAMP,
        ended_at TIMESTAMP
      )
    `;
    console.log('✅ conversations created\n');
    
    // 3. Messages table
    console.log('⏳ Creating messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sender TEXT NOT NULL,
        speaker_label TEXT,
        audio_source_id VARCHAR(255),
        customer_identification JSONB,
        discovery_questions JSONB,
        case_studies JSONB,
        competitor_analysis JSONB,
        solution_recommendations JSONB,
        product_features JSONB,
        next_steps JSONB,
        bant_qualification JSONB,
        solutions JSONB,
        problem_statement TEXT,
        recommended_solutions JSONB,
        suggested_next_prompt TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ messages created\n');
    
    // 4. Subscriptions table
    console.log('⏳ Creating subscriptions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        plan_id VARCHAR(255),
        plan_type VARCHAR(20) NOT NULL DEFAULT 'free_trial',
        status VARCHAR(20) NOT NULL DEFAULT 'trial',
        sessions_used VARCHAR(10) NOT NULL DEFAULT '0',
        sessions_limit VARCHAR(10),
        minutes_used VARCHAR(10) NOT NULL DEFAULT '0',
        minutes_limit VARCHAR(10),
        session_history JSONB DEFAULT '[]',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        canceled_at TIMESTAMP,
        cancellation_reason TEXT,
        razorpay_subscription_id VARCHAR(255),
        razorpay_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ subscriptions created\n');
    
    // 5. Payments table
    console.log('⏳ Creating payments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        subscription_id VARCHAR(255),
        organization_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(500),
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        status VARCHAR(20) NOT NULL,
        payment_method VARCHAR(50),
        receipt_url VARCHAR(500),
        metadata JSONB DEFAULT '{}',
        refunded_at TIMESTAMP,
        refund_amount VARCHAR(20),
        refund_reason TEXT,
        razorpay_refund_id VARCHAR(255),
        refunded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ payments created\n');
    
    // 6. Organizations table
    console.log('⏳ Creating organizations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        company_name VARCHAR(255) NOT NULL,
        billing_email VARCHAR(255) NOT NULL,
        primary_manager_id VARCHAR(255) REFERENCES auth_users(id),
        razorpay_customer_id VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ organizations created\n');
    
    // 7. Addon Purchases table
    console.log('⏳ Creating addon_purchases table...');
    await sql`
      CREATE TABLE IF NOT EXISTS addon_purchases (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        addon_type VARCHAR(50) NOT NULL,
        package_sku VARCHAR(100) NOT NULL,
        billing_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        purchase_amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        gateway_transaction_id VARCHAR(255),
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT false,
        total_units INTEGER NOT NULL,
        used_units INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        parent_purchase_id VARCHAR(255),
        renewal_scheduled_at TIMESTAMP,
        refunded_at TIMESTAMP,
        refund_amount VARCHAR(20),
        refund_reason TEXT,
        gateway_refund_id VARCHAR(255),
        refunded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ addon_purchases created\n');
    
    // 8. Cart Items table
    console.log('⏳ Creating cart_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        package_sku VARCHAR(100) NOT NULL,
        addon_type VARCHAR(50) NOT NULL,
        package_name VARCHAR(255) NOT NULL,
        base_price VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        metadata JSONB DEFAULT '{}',
        purchase_mode VARCHAR(20) NOT NULL DEFAULT 'user',
        team_manager_name VARCHAR(255),
        team_manager_email VARCHAR(255),
        company_name VARCHAR(255),
        promo_code_id VARCHAR(255),
        promo_code_code VARCHAR(50),
        applied_discount_amount VARCHAR(20),
        added_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ cart_items created\n');
    
    // 9. Pending Orders table
    console.log('⏳ Creating pending_orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pending_orders (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        package_sku VARCHAR(100) NOT NULL,
        addon_type VARCHAR(50) NOT NULL,
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        gateway_order_id VARCHAR(255) NOT NULL,
        gateway_provider VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        expires_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ pending_orders created\n');
    
    // 10. Traffic Logs table
    console.log('⏳ Creating traffic_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS traffic_logs (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ip_address VARCHAR(255),
        country VARCHAR(255),
        state VARCHAR(255),
        city VARCHAR(255),
        device_type VARCHAR(255),
        browser VARCHAR(255),
        visited_page TEXT,
        visit_time TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ traffic_logs created\n');
    
    // 11. User Feedback table
    console.log('⏳ Creating user_feedback table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        conversation_id VARCHAR(255),
        rating INTEGER NOT NULL,
        feedback TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ user_feedback created\n');
    
    // Create indexes
    console.log('🔨 Creating indexes...\n');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_addon_purchases_user ON addon_purchases(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_orders_user ON pending_orders(user_id)`;
    
    console.log('✅ Indexes created\n');
    
    // Final check
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('=' .repeat(60));
    console.log(`\n✅ SUCCESS! Created ${finalTables.length} tables\n`);
    
    console.log('📋 Tables in database:');
    finalTables.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name}`);
    });
    
    console.log('\n🎉 Essential tables created successfully!');
    console.log('\n🚀 Next: Run full schema push for remaining tables');
    console.log('   Command: npx drizzle-kit push\n');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

checkAndCreateTables();
