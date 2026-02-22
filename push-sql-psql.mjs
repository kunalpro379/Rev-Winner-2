#!/usr/bin/env node

/**
 * Push SQL File using psql command
 * 
 * This script uses the native psql command to execute the SQL file.
 * This is faster and more reliable for large SQL dumps.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';
const SQL_FILE = path.join(__dirname, 'download.sql');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      🚀 Push SQL File using psql (Fast Method)            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function pushWithPsql() {
  try {
    // Check if SQL file exists
    if (!fs.existsSync(SQL_FILE)) {
      console.error('❌ Error: download.sql file not found!');
      console.error(`   Expected location: ${SQL_FILE}`);
      process.exit(1);
    }

    const stats = fs.statSync(SQL_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📄 SQL File: download.sql`);
    console.log(`📊 File Size: ${fileSizeMB} MB\n`);

    // Check if psql is available
    console.log('🔍 Checking for psql command...');
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('✅ psql is available\n');
    } catch (error) {
      console.log('⚠️  psql not found. Using alternative method...\n');
      console.log('💡 To install psql:');
      console.log('   Windows: Download from https://www.postgresql.org/download/windows/');
      console.log('   Mac: brew install postgresql');
      console.log('   Linux: apt-get install postgresql-client\n');
      console.log('📝 Falling back to Node.js method...');
      console.log('   Run: node push-sql-file.mjs\n');
      process.exit(1);
    }

    // Execute SQL file using psql
    console.log('⚙️  Executing SQL file with psql...\n');
    console.log('   This may take a few minutes for large files...\n');

    const startTime = Date.now();

    try {
      // Use psql to execute the SQL file
      const command = `psql "${DATABASE_URL}" -f "${SQL_FILE}"`;
      
      execSync(command, {
        stdio: 'inherit',
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ SUCCESS!                               ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log(`⏱️  Execution time: ${duration} seconds`);
      console.log('🎉 SQL file successfully pushed to Neon!\n');

      console.log('📝 Next steps:');
      console.log('   1. Verify tables: npm run db:studio');
      console.log('   2. Check Neon Console');
      console.log('   3. Test your application');

    } catch (error) {
      console.error('\n❌ Error executing SQL file');
      console.error('   Some errors may be expected (e.g., "already exists")');
      console.error('\n💡 Try the alternative method:');
      console.error('   node push-sql-file.mjs');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

pushWithPsql();
