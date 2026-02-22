#!/usr/bin/env node

/**
 * Fix enterprise_user_assignments table - add missing user_email column
 * 
 * Error: column "user_email" does not exist
 * This column is required for enterprise user assignments
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

async function fixEnterpriseUserEmail() {
  console.log('🔧 Fixing enterprise_user_assignments table - adding user_email column\n');
  
  try {
    // Check if column exists
    console.log('1️⃣ Checking if user_email column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enterprise_user_assignments' 
      AND column_name = 'user_email'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ user_email column already exists!\n');
      return;
    }
    
    console.log('❌ user_email column is missing\n');
    
    // Add user_email column
    console.log('2️⃣ Adding user_email column...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)
    `;
    console.log('✅ Added user_email column\n');
    
    // Populate user_email from auth_users for existing records
    console.log('3️⃣ Populating user_email from auth_users...');
    const updateResult = await sql`
      UPDATE enterprise_user_assignments 
      SET user_email = auth_users.email
      FROM auth_users
      WHERE enterprise_user_assignments.user_id = auth_users.id
      AND enterprise_user_assignments.user_email IS NULL
    `;
    console.log(`✅ Updated ${updateResult.length} records with user emails\n`);
    
    // Make user_email NOT NULL after populating
    console.log('4️⃣ Making user_email NOT NULL...');
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ALTER COLUMN user_email SET NOT NULL
    `;
    console.log('✅ Set user_email as NOT NULL\n');
    
    // Create index on user_email if it doesn't exist
    console.log('5️⃣ Creating index on user_email...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enterprise_assignments_email 
      ON enterprise_user_assignments(user_email)
    `;
    console.log('✅ Created index on user_email\n');
    
    // Verify the fix
    console.log('6️⃣ Verifying the fix...');
    const verifyColumn = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'enterprise_user_assignments' 
      AND column_name = 'user_email'
    `;
    
    if (verifyColumn.length > 0) {
      console.log('✅ Verification successful!');
      console.log('   Column:', verifyColumn[0].column_name);
      console.log('   Type:', verifyColumn[0].data_type);
      console.log('   Nullable:', verifyColumn[0].is_nullable);
      console.log('\n✅ Fix completed successfully!\n');
    } else {
      console.log('❌ Verification failed - column not found\n');
    }
    
  } catch (error) {
    console.error('❌ Error fixing enterprise_user_assignments table:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

fixEnterpriseUserEmail();
