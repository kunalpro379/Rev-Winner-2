#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function verifyMigration() {
  try {
    console.log("🔍 Verifying session timer migration...\n");
    
    // Check if columns exist
    const columns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'session_usage'
      AND column_name IN ('last_resume_time', 'accumulated_duration_ms', 'is_paused')
      ORDER BY column_name
    `;
    
    console.log("📋 New columns in session_usage table:");
    console.log("─".repeat(80));
    
    if (columns.length === 0) {
      console.log("❌ No new columns found! Migration may have failed.");
    } else {
      columns.forEach(col => {
        console.log(`✅ ${col.column_name}`);
        console.log(`   Type: ${col.data_type}`);
        console.log(`   Default: ${col.column_default || 'NULL'}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log();
      });
      
      if (columns.length === 3) {
        console.log("✅ All 3 columns successfully added!");
      } else {
        console.log(`⚠️  Expected 3 columns, found ${columns.length}`);
      }
    }
    
    // Check existing sessions
    const sessionCount = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended
      FROM session_usage
    `;
    
    console.log("\n📊 Session statistics:");
    console.log("─".repeat(80));
    console.log(`Total sessions: ${sessionCount[0].total}`);
    console.log(`Active: ${sessionCount[0].active}`);
    console.log(`Paused: ${sessionCount[0].paused}`);
    console.log(`Ended: ${sessionCount[0].ended}`);
    
    await sql.end();
    console.log("\n✅ Verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    await sql.end();
    process.exit(1);
  }
}

verifyMigration();
