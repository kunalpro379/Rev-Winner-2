import { db } from "./server/db.ts";
import { sessionUsage } from "./shared/schema.ts";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Fix active sessions that were never properly ended
 * This script will:
 * 1. Find all sessions with status='active' and no endTime
 * 2. Calculate duration based on startTime to now (or cap at reasonable limit)
 * 3. Update them with endTime, durationSeconds, and status='ended'
 */

async function fixActiveSessions() {
  console.log("🔍 Finding active sessions without end time...");
  
  try {
    // Find all active sessions without end time
    const activeSessions = await db
      .select()
      .from(sessionUsage)
      .where(
        and(
          eq(sessionUsage.status, "active"),
          isNull(sessionUsage.endTime)
        )
      );
    
    console.log(`📊 Found ${activeSessions.length} active sessions to fix`);
    
    if (activeSessions.length === 0) {
      console.log("✅ No active sessions to fix!");
      return;
    }
    
    const now = new Date();
    let fixedCount = 0;
    
    for (const session of activeSessions) {
      const startTime = new Date(session.startTime);
      const durationMs = now.getTime() - startTime.getTime();
      const durationSeconds = Math.floor(durationMs / 1000);
      
      // Cap at 4 hours (14400 seconds) for safety - sessions shouldn't be longer
      const cappedDuration = Math.min(durationSeconds, 14400);
      
      // Calculate actual end time based on capped duration
      const endTime = new Date(startTime.getTime() + (cappedDuration * 1000));
      
      console.log(`  Fixing session ${session.sessionId}:`);
      console.log(`    Start: ${startTime.toISOString()}`);
      console.log(`    End: ${endTime.toISOString()}`);
      console.log(`    Duration: ${Math.floor(cappedDuration / 60)} minutes`);
      
      await db
        .update(sessionUsage)
        .set({
          endTime,
          durationSeconds: cappedDuration.toString(),
          status: "ended"
        })
        .where(eq(sessionUsage.id, session.id));
      
      fixedCount++;
    }
    
    console.log(`\n✅ Successfully fixed ${fixedCount} sessions!`);
    
  } catch (error) {
    console.error("❌ Error fixing active sessions:", error);
    throw error;
  }
}

// Run the fix
fixActiveSessions()
  .then(() => {
    console.log("\n🎉 Session fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Session fix failed:", error);
    process.exit(1);
  });
