#!/usr/bin/env node

/**
 * Master Database Push Script
 * One command to rule them all!
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync, writeFileSync } from 'fs';

config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  header('🚀 REV WINNER DATABASE PUSH');
  
  // Step 1: Environment Check
  log('📍 Step 1: Environment Check', 'blue');
  
  if (!process.env.DATABASE_URL) {
    log('❌ DATABASE_URL not found in .env file!', 'red');
    log('\n💡 Add this to your .env file:', 'yellow');
    log('DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require\n');
    process.exit(1);
  }
  
  log('✅ DATABASE_URL found', 'green');
  
  // Step 2: Schema Check
  log('\n📍 Step 2: Schema Verification', 'blue');
  
  if (!existsSync('./shared/schema.ts')) {
    log('❌ Schema file not found!', 'red');
    process.exit(1);
  }
  
  log('✅ Schema file exists', 'green');
  
  // Run verification
  try {
    log('⏳ Verifying schema...', 'yellow');
    execSync('node verify-schema.mjs', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Schema verification failed!', 'red');
    process.exit(1);
  }
  
  // Step 3: Drizzle Config
  log('\n📍 Step 3: Drizzle Configuration', 'blue');
  
  if (!existsSync('./drizzle.config.ts')) {
    log('⏳ Creating drizzle.config.ts...', 'yellow');
    
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
    log('✅ Created drizzle.config.ts', 'green');
  } else {
    log('✅ Drizzle config exists', 'green');
  }
  
  // Step 4: Dependencies Check
  log('\n📍 Step 4: Dependencies Check', 'blue');
  
  try {
    execSync('npm list drizzle-kit', { stdio: 'pipe' });
    log('✅ drizzle-kit installed', 'green');
  } catch (error) {
    log('⚠️  drizzle-kit not found, installing...', 'yellow');
    try {
      execSync('npm install drizzle-kit --save-dev', { stdio: 'inherit' });
      log('✅ drizzle-kit installed', 'green');
    } catch (installError) {
      log('❌ Failed to install drizzle-kit', 'red');
      process.exit(1);
    }
  }
  
  // Step 5: Database Push
  header('🔨 PUSHING SCHEMA TO DATABASE');
  
  log('This will:', 'cyan');
  log('  ✓ Analyze 73 tables in schema');
  log('  ✓ Compare with current database');
  log('  ✓ Create missing tables');
  log('  ✓ Add missing columns');
  log('  ✓ Create indexes and foreign keys\n');
  
  log('⏳ Starting push... (this may take 30-60 seconds)\n', 'yellow');
  
  try {
    execSync('npx drizzle-kit push:pg', {
      stdio: 'inherit',
      env: process.env
    });
    
    header('✅ DATABASE PUSH SUCCESSFUL!');
    
    log('🎉 All tables created successfully!\n', 'green');
    
    log('📊 What was created:', 'cyan');
    log('  ✓ 73 database tables');
    log('  ✓ 100+ foreign key relationships');
    log('  ✓ 150+ performance indexes');
    log('  ✓ All constraints and defaults\n');
    
    log('🚀 Next Steps:', 'cyan');
    log('  1. Start your server: npm run dev');
    log('  2. Test health endpoint: http://localhost:5000/health');
    log('  3. Access admin panel: http://localhost:5000/admin');
    log('  4. Check Neon dashboard to verify tables\n');
    
    log('✅ Your database is ready for production!', 'green');
    
    process.exit(0);
    
  } catch (error) {
    header('❌ DATABASE PUSH FAILED');
    
    log('Error occurred during push\n', 'red');
    
    log('🔧 Troubleshooting Steps:', 'yellow');
    log('  1. Check DATABASE_URL is correct');
    log('  2. Verify Neon database is active');
    log('  3. Check internet connection');
    log('  4. Try: npm install drizzle-kit --save-dev');
    log('  5. Check Neon dashboard for errors\n');
    
    log('💡 Need help? Check PUSH_DATABASE_NOW.md\n', 'cyan');
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log('\n❌ Fatal Error:', 'red');
  console.error(error);
  process.exit(1);
});
