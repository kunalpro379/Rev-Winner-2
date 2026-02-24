#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function applyMigration() {
  try {
    console.log("📦 Applying session timer migration...");
    
    // Add columns
    await sql`
      ALTER TABLE "session_usage" 
      ADD COLUMN IF NOT EXISTS "last_resume_time" timestamp,
      ADD COLUMN IF NOT EXISTS "accumulated_duration_ms" bigint DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "is_paused" boolean DEFAULT false NOT NULL
    `;
    
    console.log("✅ Added new columns to session_usage table");
    
    // Update existing active sessions
    await sql`
      UPDATE "session_usage" 
      SET 
        "last_resume_time" = "start_time",
        "accumulated_duration_ms" = 0,
        "is_paused" = false
      WHERE "status" = 'active' AND "last_resume_time" IS NULL
    `;
    
    console.log("✅ Updated existing active sessions");
    
    // Add comments
    await sql`COMMENT ON COLUMN "session_usage"."last_resume_time" IS 'Timestamp when session was last resumed (for calculating running time)'`;
    await sql`COMMENT ON COLUMN "session_usage"."accumulated_duration_ms" IS 'Total accumulated time in milliseconds (updated on pause)'`;
    await sql`COMMENT ON COLUMN "session_usage"."is_paused" IS 'Whether the session is currently paused'`;
    
    console.log("✅ Added column comments");
    
    console.log("\n✅ Migration applied successfully!");
    console.log("\nNew fields added to session_usage table:");
    console.log("  - last_resume_time: Tracks when session was last resumed");
    console.log("  - accumulated_duration_ms: Stores accumulated time in milliseconds");
    console.log("  - is_paused: Indicates if session is currently paused");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
