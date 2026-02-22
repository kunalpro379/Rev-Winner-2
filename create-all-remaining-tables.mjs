#!/usr/bin/env node

/**
 * Create ALL Remaining Tables
 * Creates all 73 tables from schema
 */

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function createAllTables() {
  try {
    console.log('🚀 Creating ALL remaining tables from schema...\n');
    
    let created = 0;
    
    // Core tables (already exist, skip)
    
    // Authentication tables
    console.log('📍 Creating authentication tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS super_user_overrides (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL UNIQUE,
        reason TEXT NOT NULL,
        granted_by VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts VARCHAR(10) NOT NULL DEFAULT '0',
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    console.log('✅ Authentication tables created\n');
    
    // Subscription & Billing tables
    console.log('📍 Creating subscription & billing tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS addons (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        slug VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        billing_interval VARCHAR(20),
        pricing_tiers JSONB,
        flat_price VARCHAR(20),
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        features JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        published_on_website BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(100) NOT NULL,
        price VARCHAR(20) NOT NULL,
        listed_price VARCHAR(20),
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        billing_interval VARCHAR(20) NOT NULL,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        published_on_website BOOLEAN DEFAULT false,
        available_until TIMESTAMP,
        required_addons JSONB DEFAULT '[]',
        razorpay_plan_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        code VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(50),
        allowed_plan_types JSONB,
        discount_type VARCHAR(20) NOT NULL,
        discount_value VARCHAR(20) NOT NULL,
        max_uses VARCHAR(10),
        uses_count VARCHAR(10) NOT NULL DEFAULT '0',
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        actor_id VARCHAR(255) REFERENCES auth_users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS session_usage (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_seconds VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS session_minutes_purchases (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        minutes_purchased INTEGER NOT NULL,
        minutes_used INTEGER NOT NULL DEFAULT 0,
        minutes_remaining INTEGER NOT NULL,
        purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
        expiry_date TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        amount_paid VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        refunded_at TIMESTAMP,
        refund_amount VARCHAR(20),
        refund_reason TEXT,
        razorpay_refund_id VARCHAR(255),
        refunded_by VARCHAR(255) REFERENCES auth_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS ai_token_usage (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        provider VARCHAR(20) NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        request_id VARCHAR(255),
        feature VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    console.log('✅ Subscription & billing tables created\n');
    
    // Enterprise tables
    console.log('📍 Creating enterprise tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS organization_memberships (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT NOW(),
        left_at TIMESTAMP
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS license_packages (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        package_type VARCHAR(50) NOT NULL,
        total_seats INTEGER NOT NULL,
        price_per_seat VARCHAR(20) NOT NULL,
        total_amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        previous_package_id VARCHAR(255),
        razorpay_subscription_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS license_assignments (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        license_package_id VARCHAR(255) NOT NULL REFERENCES license_packages(id),
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        assigned_at TIMESTAMP DEFAULT NOW(),
        unassigned_at TIMESTAMP,
        assigned_by VARCHAR(255) REFERENCES auth_users(id),
        notes TEXT
      )
    `;
    created++;
    
    console.log('✅ Enterprise tables created\n');
    
    // Marketing & Support tables
    console.log('📍 Creating marketing & support tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email VARCHAR(255) NOT NULL,
        company TEXT,
        phone TEXT,
        message TEXT,
        lead_type TEXT NOT NULL,
        department TEXT,
        total_seats INTEGER,
        estimated_timeline TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    console.log('✅ Marketing & support tables created\n');
    
    // Train Me tables
    console.log('📍 Creating Train Me tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS domain_expertise (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        company_domain VARCHAR(255),
        is_shared BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS training_documents (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        domain_expertise_id VARCHAR(255) NOT NULL REFERENCES domain_expertise(id),
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        file_url TEXT NOT NULL,
        content TEXT,
        content_source VARCHAR(20) DEFAULT 'extraction',
        audio_duration INTEGER,
        summary JSONB,
        summary_status VARCHAR(20) DEFAULT 'not_generated',
        summary_error TEXT,
        last_summarized_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        processing_error TEXT,
        knowledge_extracted_at TIMESTAMP,
        content_hash VARCHAR(64),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        domain_expertise_id VARCHAR(255) NOT NULL REFERENCES domain_expertise(id),
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        category VARCHAR(30) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        keywords TEXT[],
        source_document_ids TEXT[],
        content_hash VARCHAR(64),
        embedding JSONB,
        confidence INTEGER DEFAULT 80,
        is_verified BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    console.log('✅ Train Me tables created\n');
    
    // Admin tables
    console.log('📍 Creating admin tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        metric_type VARCHAR(50) NOT NULL,
        value VARCHAR(100) NOT NULL,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        published_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) REFERENCES auth_users(id),
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        assigned_to VARCHAR(255) REFERENCES auth_users(id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS refunds (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        payment_id VARCHAR(255) NOT NULL REFERENCES payments(id),
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        reason TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        razorpay_refund_id VARCHAR(255),
        processed_by VARCHAR(255) REFERENCES auth_users(id),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    await sql`
      CREATE TABLE IF NOT EXISTS time_extensions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        extension_type VARCHAR(20) NOT NULL,
        extension_value VARCHAR(20) NOT NULL,
        reason TEXT NOT NULL,
        granted_by VARCHAR(255) NOT NULL REFERENCES auth_users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    created++;
    
    console.log('✅ Admin tables created\n');
    
    // Create indexes
    console.log('🔨 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_usage_user ON session_usage(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user ON ai_token_usage(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_organization_memberships_org ON organization_memberships(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_license_packages_org ON license_packages(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_license_assignments_package ON license_assignments(license_package_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_domain_expertise_user ON domain_expertise(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_training_documents_domain ON training_documents(domain_expertise_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_entries_domain ON knowledge_entries(domain_expertise_id)`;
    console.log('✅ Indexes created\n');
    
    // Check final count
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('=' .repeat(60));
    console.log(`\n✅ SUCCESS! Created ${created} new tables`);
    console.log(`📊 Total tables in database: ${tables.length}\n`);
    
    console.log('🎉 Database setup complete!');
    console.log('\n🚀 Run: npm run dev\n');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

createAllTables();
