#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

// Expected columns from schema
const expectedColumns = [
  'id',
  'organization_id',
  'user_id',
  'user_email',
  'status',
  'activation_token',
  'activation_token_expires_at',
  'activated_at',
  'train_me_enabled',
  'dai_enabled',
  'assigned_by',
  'assigned_at',
  'revoked_by',
  'revoked_at',
  'notes',
  'created_at',
  'updated_at'
];

async function checkColumns() {
  console.log('🔍 Checking enterprise_user_assignments columns\n');
  
  const currentColumns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'enterprise_user_assignments'
    ORDER BY ordinal_position
  `;
  
  const currentColumnNames = currentColumns.map(c => c.column_name);
  
  console.log('Current columns:', currentColumnNames.length);
  console.log('Expected columns:', expectedColumns.length);
  console.log('');
  
  const missing = expectedColumns.filter(col => !currentColumnNames.includes(col));
  const extra = currentColumnNames.filter(col => !expectedColumns.includes(col));
  
  if (missing.length > 0) {
    console.log('❌ Missing columns:');
    missing.forEach(col => console.log(`   - ${col}`));
    console.log('');
  }
  
  if (extra.length > 0) {
    console.log('⚠️  Extra columns (not in schema):');
    extra.forEach(col => console.log(`   - ${col}`));
    console.log('');
  }
  
  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ All columns match schema!\n');
  }
}

checkColumns();
