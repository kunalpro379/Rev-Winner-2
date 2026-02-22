#!/usr/bin/env node

/**
 * Complete fix for enterprise_user_assignments table
 * Adds all missing columns to match the current schema
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

async function fixEnterpriseAssignments() {
  console.log('🔧 Fixing enterprise_user_assignments table - adding all missing columns\n');
  
  try {
    // Add activation_token column
    console.log('1️⃣ Adding activation_token column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255)
    `;
    console.log('✅ Added activation_token\n');
    
    // Add activation_token_expires_at column
    console.log('2️⃣ Adding activation_token_expires_at column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMP
    `;
    console.log('✅ Added activation_token_expires_at\n');
    
    // Add activated_at column
    console.log('3️⃣ Adding activated_at column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP
    `;
    console.log('✅ Added activated_at\n');
    
    // Add revoked_by column
    console.log('4️⃣ Adding revoked_by column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS revoked_by VARCHAR(255)
    `;
    console.log('✅ Added revoked_by\n');
    
    // Add revoked_at column
    console.log('5️⃣ Adding revoked_at column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP
    `;
    console.log('✅ Added revoked_at\n');
    
    // Verify all columns
    console.log('6️⃣ Verifying columns...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'enterprise_user_assignments'
      ORDER BY ordinal_position
    `;
    
    console.log(`\n✅ Table now has ${columns.length} columns:\n`);
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
    });
    
    // Check for required columns
    const requiredColumns = [
      'activation_token',
      'activation_token_expires_at',
      'activated_at',
      'revoked_by',
      'revoked_at',
      'user_email'
    ];
    
    const columnNames = columns.map(c => c.column_name);
    const missingRequired = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingRequired.length > 0) {
      console.log('\n❌ Still missing required columns:');
      missingRequired.forEach(col => console.log(`   - ${col}`));
      process.exit(1);
    }
    
    console.log('\n✅ All required columns present! Cart checkout should work now.\n');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

fixEnterpriseAssignments();
