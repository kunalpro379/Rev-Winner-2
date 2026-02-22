#!/usr/bin/env node

/**
 * Schema Verification Script
 * Verifies that all tables in schema.ts are properly defined
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Database Schema...\n');

try {
  // Import the schema
  const schemaPath = join(__dirname, 'shared', 'schema.ts');
  console.log(`📁 Schema file: ${schemaPath}`);
  
  // Check if schema file exists
  const fs = await import('fs');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found!');
    process.exit(1);
  }
  
  console.log('✅ Schema file exists');
  
  // Read schema file content
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // Count table definitions
  const tableMatches = schemaContent.match(/export const \w+ = pgTable\(/g);
  const tableCount = tableMatches ? tableMatches.length : 0;
  
  console.log(`\n📊 Found ${tableCount} table definitions`);
  
  // Extract table names
  const tableNames = [];
  const tableRegex = /export const (\w+) = pgTable\(/g;
  let match;
  while ((match = tableRegex.exec(schemaContent)) !== null) {
    tableNames.push(match[1]);
  }
  
  console.log('\n📋 Tables defined:');
  tableNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  
  // Check for critical tables
  const criticalTables = [
    'authUsers',
    'conversations',
    'messages',
    'subscriptions',
    'payments',
    'organizations',
    'trafficLogs',
    'userFeedback',
    'addonPurchases',
    'cartItems',
    'pendingOrders'
  ];
  
  console.log('\n🔑 Checking critical tables:');
  let allCriticalFound = true;
  criticalTables.forEach(table => {
    const found = tableNames.includes(table);
    console.log(`   ${found ? '✅' : '❌'} ${table}`);
    if (!found) allCriticalFound = false;
  });
  
  // Check for insert schemas
  const insertSchemaMatches = schemaContent.match(/export const insert\w+Schema/g);
  const insertSchemaCount = insertSchemaMatches ? insertSchemaMatches.length : 0;
  
  console.log(`\n📝 Found ${insertSchemaCount} insert schemas`);
  
  // Check for type exports
  const typeMatches = schemaContent.match(/export type \w+ = typeof \w+\.\$inferSelect/g);
  const typeCount = typeMatches ? typeMatches.length : 0;
  
  console.log(`📦 Found ${typeCount} type exports`);
  
  // Final verdict
  console.log('\n' + '='.repeat(50));
  if (allCriticalFound && tableCount > 50) {
    console.log('✅ Schema verification PASSED');
    console.log('✅ All critical tables found');
    console.log(`✅ ${tableCount} tables defined`);
    console.log('\n🚀 Ready for database push!');
    console.log('\nRun: npm run db:push');
    process.exit(0);
  } else {
    console.log('❌ Schema verification FAILED');
    if (!allCriticalFound) {
      console.log('❌ Missing critical tables');
    }
    if (tableCount < 50) {
      console.log(`❌ Expected 50+ tables, found ${tableCount}`);
    }
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Error verifying schema:', error.message);
  process.exit(1);
}
