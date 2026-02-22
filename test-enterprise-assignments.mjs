#!/usr/bin/env node

/**
 * Test script to verify enterprise_user_assignments table has user_email column
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

async function testEnterpriseAssignments() {
  console.log('🧪 Testing enterprise_user_assignments table\n');
  
  try {
    // Check table structure
    console.log('1️⃣ Checking table columns...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'enterprise_user_assignments'
      ORDER BY ordinal_position
    `;
    
    console.log(`\n✅ Found ${columns.length} columns:\n`);
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
    });
    
    // Check if user_email exists
    const userEmailColumn = columns.find(c => c.column_name === 'user_email');
    if (userEmailColumn) {
      console.log('\n✅ user_email column exists!');
      console.log(`   Type: ${userEmailColumn.data_type}`);
      console.log(`   Nullable: ${userEmailColumn.is_nullable}`);
    } else {
      console.log('\n❌ user_email column is MISSING!');
      console.log('   Run: node fix-enterprise-user-email.mjs');
      process.exit(1);
    }
    
    // Check indexes
    console.log('\n2️⃣ Checking indexes...');
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'enterprise_user_assignments'
    `;
    
    console.log(`\n✅ Found ${indexes.length} indexes:\n`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    const emailIndex = indexes.find(i => i.indexname === 'idx_enterprise_assignments_email');
    if (emailIndex) {
      console.log('\n✅ Email index exists!');
    } else {
      console.log('\n⚠️  Email index is missing (optional but recommended)');
    }
    
    // Test query
    console.log('\n3️⃣ Testing query...');
    const testQuery = await sql`
      SELECT id, organization_id, user_id, user_email, status
      FROM enterprise_user_assignments
      LIMIT 5
    `;
    
    console.log(`\n✅ Query successful! Found ${testQuery.length} records\n`);
    
    if (testQuery.length > 0) {
      console.log('Sample records:');
      testQuery.forEach((record, i) => {
        console.log(`\n   Record ${i + 1}:`);
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Organization: ${record.organization_id}`);
        console.log(`   - User: ${record.user_id || 'NULL'}`);
        console.log(`   - Email: ${record.user_email}`);
        console.log(`   - Status: ${record.status}`);
      });
    } else {
      console.log('   No records found (table is empty)');
    }
    
    console.log('\n✅ All tests passed! Cart checkout should work now.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEnterpriseAssignments();
