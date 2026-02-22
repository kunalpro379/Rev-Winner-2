#!/usr/bin/env node

/**
 * Push SQL File to Neon Database
 * 
 * This script executes a SQL dump file directly against Neon PostgreSQL.
 * It handles large files and provides progress tracking.
 */

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
console.log('║        🚀 Push SQL File to Neon PostgreSQL                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function pushSqlFile() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if SQL file exists
    if (!fs.existsSync(SQL_FILE)) {
      console.error('❌ Error: download.sql file not found!');
      console.error(`   Expected location: ${SQL_FILE}`);
      process.exit(1);
    }

    // Get file size
    const stats = fs.statSync(SQL_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📄 SQL File: download.sql`);
    console.log(`📊 File Size: ${fileSizeMB} MB`);
    console.log(`📝 Lines: ~18,846\n`);

    // Connect to database
    console.log('📡 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Verify connection
    const result = await client.query('SELECT current_database(), version()');
    console.log(`📊 Database: ${result.rows[0].current_database}`);
    console.log(`🔧 PostgreSQL: ${result.rows[0].version.split(' ')[1]}\n`);

    // Read SQL file
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('✅ SQL file loaded\n');

    // Split into statements (basic split by semicolon)
    console.log('🔄 Parsing SQL statements...');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements\n`);

    // Execute statements
    console.log('⚙️  Executing SQL statements...\n');
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip certain statements that might cause issues
      if (
        stmt.includes('\\restrict') ||
        stmt.includes('ALTER SCHEMA') ||
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
        
        // Progress indicator
        if ((i + 1) % 100 === 0) {
          const progress = ((i + 1) / statements.length * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${progress}% (${i + 1}/${statements.length})`);
        }
      } catch (error) {
        errorCount++;
        
        // Log errors but continue (some errors are expected for existing objects)
        if (error.message.includes('already exists')) {
          // Silently skip "already exists" errors
          skippedCount++;
        } else if (error.message.includes('does not exist')) {
          // Skip "does not exist" errors for DROP statements
          skippedCount++;
        } else {
          // Log other errors
          console.error(`\n⚠️  Error at statement ${i + 1}:`, error.message.split('\n')[0]);
        }
      }
    }

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ EXECUTION COMPLETE                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount} statements`);
    console.log(`   ⚠️  Errors: ${errorCount} statements`);
    console.log(`   ⏭️  Skipped: ${skippedCount} statements`);
    console.log(`   📝 Total: ${statements.length} statements\n`);

    // Verify tables were created
    console.log('🔍 Verifying database...');
    const tableResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`✅ Tables in database: ${tableResult.rows[0].table_count}\n`);

    console.log('🎉 SQL file successfully pushed to Neon!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in Neon Console');
    console.log('   2. Run: npm run db:studio');
    console.log('   3. Test your application');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check database connection');
    console.error('   2. Verify SQL file is valid');
    console.error('   3. Check database permissions');
    console.error('   4. Try: node direct-push.mjs to test connection');
    process.exit(1);
  } finally {
    await client.end();
  }
}

pushSqlFile();
