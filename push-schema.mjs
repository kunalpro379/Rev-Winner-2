#!/usr/bin/env node

/**
 * Push Database Schema to Neon
 * 
 * This script pushes the complete database schema to Neon PostgreSQL.
 * It uses drizzle-kit to generate and apply migrations.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     🚀 Rev Winner Database Schema Push to Neon            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📊 Target Database: revwinner');
console.log('🌐 Region: us-east-1 (AWS Neon)');
console.log('🔐 Connection: Pooled (SSL Required)\n');

try {
  console.log('Step 1: Checking drizzle-kit installation...');
  
  try {
    execSync('npx drizzle-kit --version', { stdio: 'pipe' });
    console.log('✅ drizzle-kit is available\n');
  } catch (error) {
    console.log('⚠️  drizzle-kit not found, installing...');
    execSync('npm install -D drizzle-kit', { stdio: 'inherit' });
    console.log('✅ drizzle-kit installed\n');
  }

  console.log('Step 2: Generating migration files...');
  console.log('   This will analyze your schema and create SQL migrations\n');
  
  try {
    execSync('npx drizzle-kit generate', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL }
    });
    console.log('\n✅ Migration files generated\n');
  } catch (error) {
    console.log('⚠️  No changes detected or generation skipped\n');
  }

  console.log('Step 3: Pushing schema to Neon database...');
  console.log('   This will apply all changes to your database\n');
  
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL }
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ✅ SUCCESS!                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('🎉 Database schema successfully pushed to Neon!');
  console.log('\n📝 What was done:');
  console.log('   ✓ All tables created/updated');
  console.log('   ✓ Indexes applied');
  console.log('   ✓ Foreign keys established');
  console.log('   ✓ Constraints configured');
  
  console.log('\n🔍 Next steps:');
  console.log('   1. Verify tables: npx drizzle-kit studio');
  console.log('   2. Check database in Neon console');
  console.log('   3. Test your application');
  
} catch (error) {
  console.error('\n❌ Error during schema push:');
  console.error(error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Check your database connection');
  console.error('   2. Verify DATABASE_URL is correct');
  console.error('   3. Ensure Neon database is accessible');
  console.error('   4. Check for syntax errors in schema.ts');
  process.exit(1);
}
