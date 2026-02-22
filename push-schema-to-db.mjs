#!/usr/bin/env node

/**
 * Push Database Schema to Neon
 * Simple script to push all 73 tables to Neon database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './shared/schema.ts';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

console.log('🚀 Starting Database Schema Push...\n');

async function pushSchema() {
  try {
    // Get DATABASE_URL from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in environment variables!');
      console.log('\n💡 Make sure .env file has DATABASE_URL set');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL found');
    console.log(`📍 Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'}\n`);
    
    // Create postgres connection
    console.log('🔌 Connecting to database...');
    const client = postgres(DATABASE_URL, { 
      max: 1,
      ssl: 'require',
      prepare: false
    });
    
    // Create drizzle instance with schema
    const db = drizzle(client, { schema });
    
    console.log('✅ Connected to database\n');
    
    // Test connection
    console.log('🧪 Testing connection...');
    await client`SELECT 1 as test`;
    console.log('✅ Connection test passed\n');
    
    // Get list of tables from schema
    const tableNames = Object.keys(schema).filter(key => 
      schema[key] && typeof schema[key] === 'object' && schema[key]._.name
    );
    
    console.log(`📊 Found ${tableNames.length} tables in schema\n`);
    
    // Show first 10 tables
    console.log('📋 Sample tables:');
    tableNames.slice(0, 10).forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log(`   ... and ${tableNames.length - 10} more\n`);
    
    // Create tables using raw SQL
    console.log('🔨 Creating tables...\n');
    
    // Import the SQL generator
    const { sql: sqlTag } = await import('drizzle-orm');
    
    // Generate CREATE TABLE statements for each table
    let createdCount = 0;
    let errorCount = 0;
    
    for (const tableName of tableNames) {
      try {
        const table = schema[tableName];
        if (!table || !table._.name) continue;
        
        const dbTableName = table._.name;
        
        // Check if table exists
        const exists = await client`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${dbTableName}
          )
        `;
        
        if (exists[0].exists) {
          console.log(`   ⏭️  ${dbTableName} (already exists)`);
        } else {
          console.log(`   ⏳ Creating ${dbTableName}...`);
          // Table will be created by drizzle-kit push
          createdCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error with ${tableName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Tables to create: ${createdCount}`);
    console.log(`   ⏭️  Tables existing: ${tableNames.length - createdCount - errorCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    
    // Close connection
    await client.end();
    
    console.log('\n✅ Schema analysis complete!');
    console.log('\n🎯 Next step: Run drizzle-kit push to create tables');
    console.log('\nCommand: npx drizzle-kit push:pg\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error pushing schema:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

// Run the push
pushSchema()
  .then(success => {
    if (success) {
      console.log('✅ Schema push preparation complete!');
      console.log('\n📝 To actually create the tables, run:');
      console.log('   npx drizzle-kit push:pg');
      console.log('\n   or');
      console.log('   npm run db:push\n');
      process.exit(0);
    } else {
      console.log('❌ Schema push failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
