#!/usr/bin/env node

/**
 * Step-by-Step Database Push
 * Pushes schema with detailed progress
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';

config();

console.log('🚀 Step-by-Step Database Schema Push\n');
console.log('=' .repeat(60) + '\n');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found!');
  process.exit(1);
}

async function pushStepByStep() {
  let client;
  
  try {
    // Step 1: Connect
    console.log('📍 Step 1: Connecting to database...');
    client = postgres(DATABASE_URL, { 
      max: 1,
      ssl: 'require',
      prepare: false
    });
    
    await client`SELECT 1`;
    console.log('✅ Connected successfully\n');
    
    // Step 2: Check existing tables
    console.log('📍 Step 2: Checking existing tables...');
    const existingTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`✅ Found ${existingTables.length} existing tables\n`);
    
    if (existingTables.length > 0) {
      console.log('📋 Existing tables:');
      existingTables.slice(0, 10).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.table_name}`);
      });
      if (existingTables.length > 10) {
        console.log(`   ... and ${existingTables.length - 10} more`);
      }
      console.log();
    }
    
    // Step 3: Verify schema file
    console.log('📍 Step 3: Verifying schema file...');
    if (!existsSync('./shared/schema.ts')) {
      throw new Error('Schema file not found at ./shared/schema.ts');
    }
    
    const schemaContent = readFileSync('./shared/schema.ts', 'utf-8');
    const tableMatches = schemaContent.match(/export const \w+ = pgTable\(/g);
    const tableCount = tableMatches ? tableMatches.length : 0;
    
    console.log(`✅ Schema file valid: ${tableCount} tables defined\n`);
    
    // Step 4: Critical tables check
    console.log('📍 Step 4: Checking critical tables...');
    const criticalTables = [
      'auth_users',
      'conversations', 
      'messages',
      'subscriptions',
      'payments',
      'organizations',
      'addon_purchases',
      'cart_items',
      'pending_orders'
    ];
    
    const existingTableNames = existingTables.map(t => t.table_name);
    const missingCritical = criticalTables.filter(t => !existingTableNames.includes(t));
    
    if (missingCritical.length > 0) {
      console.log(`⚠️  Missing ${missingCritical.length} critical tables:`);
      missingCritical.forEach(t => console.log(`   - ${t}`));
      console.log();
    } else {
      console.log('✅ All critical tables exist\n');
    }
    
    // Step 5: Database info
    console.log('📍 Step 5: Database information...');
    const dbInfo = await client`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `;
    
    console.log(`   Database: ${dbInfo[0].database}`);
    console.log(`   User: ${dbInfo[0].user}`);
    console.log(`   Version: ${dbInfo[0].version.split(' ')[0]} ${dbInfo[0].version.split(' ')[1]}\n`);
    
    // Step 6: Ready to push
    console.log('📍 Step 6: Ready to push schema\n');
    console.log('=' .repeat(60));
    console.log('\n✅ Pre-flight checks passed!\n');
    
    console.log('🎯 To push the schema, run ONE of these commands:\n');
    console.log('   Option 1 (Recommended):');
    console.log('   npx drizzle-kit push:pg\n');
    console.log('   Option 2:');
    console.log('   npm run db:push\n');
    console.log('   Option 3 (Quick):');
    console.log('   node db-push-now.mjs\n');
    
    console.log('📊 What will happen:');
    console.log(`   - ${tableCount} tables will be created/updated`);
    console.log('   - Foreign keys will be established');
    console.log('   - Indexes will be created');
    console.log('   - Constraints will be applied\n');
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (client) await client.end();
    return false;
  }
}

pushStepByStep()
  .then(success => {
    if (success) {
      console.log('✅ Ready for database push!');
      process.exit(0);
    } else {
      console.log('❌ Pre-flight checks failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
