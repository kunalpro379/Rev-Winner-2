#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function testCurrentSessionQuery() {
  try {
    console.log("🧪 Testing current session query logic...\n");
    
    // Get a sample user with sessions
    const users = await sql`
      SELECT DISTINCT user_id 
      FROM session_usage 
      LIMIT 1
    `;
    
    if (users.length === 0) {
      console.log("⚠️  No sessions found in database");
      await sql.end();
      return;
    }
    
    const userId = users[0].user_id;
    console.log(`Testing with user: ${userId}\n`);
    
    // Test the query that the endpoint uses
    const sessions = await sql`
      SELECT *
      FROM session_usage
      WHERE user_id = ${userId}
        AND (status = 'active' OR status = 'paused')
      ORDER BY start_time DESC
      LIMIT 1
    `;
    
    console.log("📋 Query result:");
    console.log("─".repeat(80));
    
    if (sessions.length === 0) {
      console.log("✅ No active/paused sessions (this is OK)");
      console.log("   Endpoint should return: { session: null }");
    } else {
      const session = sessions[0];
      console.log("✅ Found active/paused session:");
      console.log(`   Session ID: ${session.session_id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Start Time: ${session.start_time}`);
      console.log(`   Last Resume Time: ${session.last_resume_time}`);
      console.log(`   Accumulated Duration: ${session.accumulated_duration_ms}ms`);
      console.log(`   Is Paused: ${session.is_paused}`);
      
      // Calculate current duration (same logic as endpoint)
      const now = new Date();
      let currentDurationMs = session.accumulated_duration_ms || 0;
      
      if (!session.is_paused && session.last_resume_time) {
        const runningSinceMs = now.getTime() - new Date(session.last_resume_time).getTime();
        currentDurationMs += runningSinceMs;
      }
      
      console.log(`\n   Calculated Current Duration: ${currentDurationMs}ms = ${Math.floor(currentDurationMs/1000)}s`);
    }
    
    // Check all sessions for this user
    const allSessions = await sql`
      SELECT session_id, status, start_time, 
             accumulated_duration_ms, is_paused, last_resume_time
      FROM session_usage
      WHERE user_id = ${userId}
      ORDER BY start_time DESC
      LIMIT 5
    `;
    
    console.log(`\n📊 Recent sessions for user (showing ${allSessions.length}):`);
    console.log("─".repeat(80));
    allSessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.session_id.substring(0, 20)}... - ${s.status} - ${s.accumulated_duration_ms}ms`);
    });
    
    await sql.end();
    console.log("\n✅ Test complete!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    await sql.end();
    process.exit(1);
  }
}

testCurrentSessionQuery();
