import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';
import { eq, and, inArray, isNotNull } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  try {
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    console.log('🔧 Fixing subscription limits...\n');

    // Fix: Update all active paid subscriptions to have NULL limits (unlimited)
    const updated = await db
      .update(schema.subscriptions)
      .set({
        sessionsLimit: null,
        minutesLimit: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.subscriptions.status, 'active'),
          inArray(schema.subscriptions.planType, ['monthly', 'annual', 'yearly', 'one_time']),
          isNotNull(schema.subscriptions.sessionsLimit)
        )
      )
      .returning();

    console.log(`✅ Updated ${updated.length} subscriptions to have unlimited limits!\n`);

    // Show before/after
    updated.slice(0, 3).forEach((sub) => {
      console.log(`  - User: ${sub.userId}`);
      console.log(`    Status: ${sub.status} | Plan: ${sub.planType}`);
      console.log(`    Sessions: NULL (was 3) | Minutes: NULL (was 180)\n`);
    });

    console.log('🎉 Fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
