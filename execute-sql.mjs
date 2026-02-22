#!/usr/bin/env node

/**
 * Execute SQL File - Simple and Fast
 * 
 * Executes download.sql against Neon PostgreSQL
 */

import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';

console.log('🚀 Executing SQL File...\n');

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  query_timeout: 300000, // 5 minutes
});

async function execute() {
  try {
    console.log('📡 Connecting...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('📖 Reading SQL file...');
    const sql = fs.readFileSync('download.sql', 'utf8');
    console.log(`✅ Loaded ${(sql.length / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('⚙️  Executing SQL (this may take a few minutes)...\n');
    
    const startTime = Date.now();
    
    // Execute the entire SQL file as one query
    await client.query(sql);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Success! Completed in ${duration} seconds\n`);

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Tables in database: ${result.rows[0].count}\n`);
    console.log('🎉 Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If single query fails, try statement by statement
    if (error.message.includes('syntax error') || error.message.includes('cannot execute')) {
      console.log('\n⚠️  Trying statement-by-statement execution...\n');
      await executeStatements();
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

async function executeStatements() {
  const client2 = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client2.connect();
    
    const sql = fs.readFileSync('download.sql', 'utf8');
    
    // Simple split by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('\\restrict'));

    console.log(`📋 Executing ${statements.length} statements...\n`);

    let success = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
      try {
        await client2.query(statements[i]);
        success++;
        
        if ((i + 1) % 100 === 0) {
          process.stdout.write(`\r   Progress: ${i + 1}/${statements.length}`);
        }
      } catch (err) {
        if (!err.message.includes('already exists')) {
          errors++;
        }
      }
    }

    console.log(`\n\n✅ Success: ${success}, Errors: ${errors}\n`);

  } finally {
    await client2.end();
  }
}

execute();
