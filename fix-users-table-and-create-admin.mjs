#!/usr/bin/env node

/**
 * Fix Users Table and Create Admin
 * 1. Creates legacy 'users' table for compatibility
 * 2. Creates admin user in auth_users
 * 3. Returns admin credentials
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import crypto from 'crypto';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function fixAndCreateAdmin() {
  try {
    console.log('🔧 Fixing database and creating admin user...\n');
    
    // 1. Create legacy 'users' table for Replit Auth compatibility
    console.log('📍 Step 1: Creating legacy users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Legacy users table created\n');
    
    // 2. Create sessions table if not exists
    console.log('📍 Step 2: Creating sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire)`;
    console.log('✅ Sessions table created\n');
    
    // 3. Check if admin already exists
    console.log('📍 Step 3: Checking for existing admin...');
    const existingAdmin = await sql`
      SELECT * FROM auth_users 
      WHERE role IN ('admin', 'super_admin') 
      LIMIT 1
    `;
    
    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin[0].email}`);
      console.log(`   Username: ${existingAdmin[0].username}`);
      console.log(`   Role: ${existingAdmin[0].role}\n`);
      console.log('💡 Use password reset if you forgot the password\n');
      await sql.end();
      return;
    }
    
    // 4. Create admin user
    console.log('📍 Step 4: Creating admin user...');
    
    const adminEmail = 'admin@revwinner.com';
    const adminUsername = 'admin';
    const adminPassword = crypto.randomBytes(8).toString('hex'); // Random secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const [admin] = await sql`
      INSERT INTO auth_users (
        email,
        mobile,
        first_name,
        last_name,
        organization,
        username,
        hashed_password,
        role,
        status,
        email_verified,
        terms_accepted,
        session_version
      ) VALUES (
        ${adminEmail},
        NULL,
        'Super',
        'Admin',
        'Rev Winner',
        ${adminUsername},
        ${hashedPassword},
        'super_admin',
        'active',
        true,
        true,
        0
      )
      RETURNING *
    `;
    
    console.log('✅ Admin user created successfully!\n');
    
    // 5. Create subscription for admin (unlimited access)
    console.log('📍 Step 5: Creating admin subscription...');
    await sql`
      INSERT INTO subscriptions (
        user_id,
        plan_type,
        status,
        sessions_used,
        sessions_limit,
        minutes_used,
        minutes_limit,
        session_history,
        current_period_start,
        current_period_end
      ) VALUES (
        ${admin.id},
        'enterprise',
        'active',
        '0',
        NULL,
        '0',
        NULL,
        '[]',
        NOW(),
        NOW() + INTERVAL '10 years'
      )
    `;
    console.log('✅ Admin subscription created\n');
    
    // 6. Display credentials
    console.log('=' .repeat(60));
    console.log('\n🎉 ADMIN USER CREATED SUCCESSFULLY!\n');
    console.log('=' .repeat(60));
    console.log('\n📋 Admin Credentials:\n');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     super_admin`);
    console.log(`   Status:   active\n`);
    console.log('=' .repeat(60));
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('   This password will not be shown again.\n');
    console.log('🔐 Login URL: http://localhost:5000/admin\n');
    console.log('=' .repeat(60));
    
    // 7. Check final table count
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Total tables in database: ${tables.length}`);
    console.log('\n✅ Database setup complete!');
    console.log('🚀 Server should now start without errors\n');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

fixAndCreateAdmin();
