#!/usr/bin/env node

/**
 * Direct Database Push Script
 * Uses drizzle-kit to push schema directly to Neon
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
config();

console.log('🚀 Database Schema Push Script\n');
console.log('=' .repeat(50) + '\n');

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file!');
  console.log('\n💡 Please add DATABASE_URL to your .env file');
  console.log('   Format: postgresql://user:password@host/database?sslmode=require\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');

// Check if schema file exists
if (!existsSync('./shared/schema.ts')) {
  console.error('❌ Schema file not found at ./shared/schema.ts');
  process.exit(1);
}

console.log('✅ Schema file found');

// Check if drizzle.config.ts exists
if (!existsSync('./drizzle.config.ts')) {
  console.error('❌ drizzle.config.ts not found!');
  console.log('\n💡 Creating drizzle.config.ts...\n');
  
  const { writeFileSync } = await import('fs');
  const configContent = `import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config();

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
`;
  
  writeFileSync('./drizzle.config.ts', configContent);
  console.log('✅ Created drizzle.config.ts\n');
}

console.log('✅ Drizzle config found\n');

console.log('🔨 Starting database push...\n');
console.log('This will:');
console.log('  1. Analyze your schema (73 tables)');
console.log('  2. Compare with database');
console.log('  3. Create missing tables');
console.log('  4. Add missing columns');
console.log('  5. Create indexes\n');

try {
  // Run drizzle-kit push
  console.log('⏳ Running: npx drizzle-kit push:pg\n');
  console.log('=' .repeat(50) + '\n');
  
  execSync('npx drizzle-kit push:pg', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Database push completed successfully!\n');
  
  console.log('📊 Next steps:');
  console.log('  1. Check Neon dashboard to verify tables');
  console.log('  2. Test your API endpoints');
  console.log('  3. Start your server: npm run dev\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Database push failed!');
  console.error('\nError:', error.message);
  
  console.log('\n🔧 Troubleshooting:');
  console.log('  1. Check DATABASE_URL is correct');
  console.log('  2. Verify Neon database is active');
  console.log('  3. Check network connection');
  console.log('  4. Try: npm install drizzle-kit --save-dev\n');
  
  process.exit(1);
}
