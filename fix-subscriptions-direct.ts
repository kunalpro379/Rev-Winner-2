/**
 * Fix Subscriptions Script
 * Updates paid subscriptions to have NULL limits (unlimited) instead of trial limits
 * Run this with: npx ts-node fix-subscriptions-direct.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';
import { eq, isNotNull, and, inArray } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function fixSubscriptions() {
  try {
    console.log('🔧 Starting subscription fix...\n');

    // Find all active paid subscriptions with trial limits
    const paidSubscriptionsWithTrialLimits = await db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.status, 'active'),
          inArray(schema.subscriptions.planType, ['monthly', 'annual', 'yearly', 'one_time']),
          isNotNull(schema.subscriptions.sessionsLimit)
        )
      );

    console.log(`Found ${paidSubscriptionsWithTrialLimits.length} paid subscriptions with trial limits\n`);

    if (paidSubscriptionsWithTrialLimits.length === 0) {
      console.log('✅ No subscriptions need fixing!');
      process.exit(0);
    }

    // Log before fixing
    console.log('Before fix:');
    paidSubscriptionsWithTrialLimits.slice(0, 5).forEach(sub => {
      console.log(
        `  - User: ${sub.userId}, Status: ${sub.status}, Sessions: ${sub.sessionsLimit}, Minutes: ${sub.minutesLimit}`
      );
    });

    // Fix: Set trial limits to NULL for all active paid subscriptions
    const result = await db
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

    console.log(`\n✅ Fixed ${result.length} subscriptions!\n`);

    // Log after fixing
    console.log('After fix:');
    result.slice(0, 5).forEach(sub => {
      console.log(
        `  - User: ${sub.userId}, Status: ${sub.status}, Sessions: ${sub.sessionsLimit}, Minutes: ${sub.minutesLimit}`
      );
    });

    console.log('\n🎉 Subscription fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error);
    process.exit(1);
  }
}

fixSubscriptions();
