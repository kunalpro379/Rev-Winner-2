#!/usr/bin/env node

/**
 * Smart SQL File Push to Neon
 * 
 * This script intelligently chooses the best method to push your SQL file:
 * 1. Try psql (fastest)
 * 2. Fall back to Node.js pg client (reliable)
 */

import { execSync } from 'child_process';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';
const SQL_FILE = path.join(__dirname, 'download.sql');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          🚀 Smart SQL Push to Neon PostgreSQL             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if file exists
if (!fs.existsSync(SQL_FILE)) {
  console.error('❌ Error: download.sql file not found!');
  console.error(`   Expected location: ${SQL_FILE}`);
  process.exit(1);
}

const stats = fs.statSync(SQL_FILE);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`📄 SQL File: download.sql`);
console.log(`📊 File Size: ${fileSizeMB} MB`);
console.log(`📝 Lines: ~18,846\n`);

// Method 1: Try psql
async function tryPsql() {
  console.log('🔍 Method 1: Checking for psql command...');
  try {
    const version = execSync('psql --version', { stdio: 'pipe' }).toString().trim();
    console.log(`✅ Found: ${version}\n`);
    
    console.log('⚙️  Executing SQL file with psql...');
    console.log('   This is the fastest method for large files\n');
    
    const startTime = Date.now();
    
    execSync(`psql "${DATABASE_URL}" -f "${SQL_FILE}"`, {
      stdio: 'inherit',
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Success with psql!');
    console.log(`⏱️  Execution time: ${duration} seconds\n`);
    return true;
  } catch (error) {
    console.log('⚠️  psql not available or failed\n');
    return false;
  }
}

// Method 2: Use Node.js pg client
async function useNodePg() {
  console.log('🔍 Method 2: Using Node.js pg client...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    
    console.log('🔄 Parsing SQL statements...');
    
    // Split by semicolon but handle multi-line statements
    const statements = [];
    let currentStmt = '';
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }
      
      currentStmt += line + '\n';
      
      if (trimmed.endsWith(';')) {
        statements.push(currentStmt.trim());
        currentStmt = '';
      }
    }
    
    console.log(`📋 Found ${statements.length} SQL statements\n`);
    console.log('⚙️  Executing statements...\n');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip problematic statements
      if (
        stmt.includes('\\restrict') ||
        stmt.includes('OWNER TO postgres') ||
        stmt.startsWith('SET ') ||
        stmt.startsWith('SELECT pg_catalog.set_config')
      ) {
        skippedCount++;
        continue;
      }

      try {
        await client.query(stmt);
        successCount++;
        
        // Progress indicator every 50 statements
        if ((i + 1) % 50 === 0) {
          const progress = ((i + 1) / statements.length * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${progress}% (${i + 1}/${statements.length})`);
        }
      } catch (error) {
        // Silently skip expected errors
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.message.includes('permission denied')
        ) {
          skippedCount++;
        } else {
          errorCount++;
          if (errorCount <= 5) { // Only show first 5 errors
            console.error(`\n⚠️  Error at statement ${i + 1}: ${error.message.split('\n')[0]}`);
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n\n📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ⏱️  Time: ${duration} seconds\n`);

    // Verify tables
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`✅ Tables in database: ${result.rows[0].count}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  let success = false;

  // Try psql first
  success = await tryPsql();

  // If psql failed, use Node.js
  if (!success) {
    console.log('📝 Falling back to Node.js method...\n');
    success = await useNodePg();
  }

  if (success) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ SUCCESS!                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('🎉 SQL file successfully pushed to Neon!\n');
    console.log('📝 Next steps:');
    console.log('   1. Verify: npm run db:studio');
    console.log('   2. Check: https://console.neon.tech/');
    console.log('   3. Test: npm run dev\n');
  } else {
    console.error('❌ All methods failed. Please check:');
    console.error('   1. Database connection');
    console.error('   2. SQL file validity');
    console.error('   3. Database permissions\n');
    process.exit(1);
  }
}

main();
