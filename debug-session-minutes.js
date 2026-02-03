const { db } = require('./server/db.ts');
const { addonPurchases, sessionMinutesUsage } = require('./shared/schema.ts');
const { eq } = require('drizzle-orm');

async function debugSessionMinutes() {
  try {
    console.log('=== DEBUGGING SESSION MINUTES ===');
    
    // Get all session minutes purchases
    const purchases = await db.select().from(addonPurchases).where(eq(addonPurchases.addonType, 'session_minutes'));
    console.log('\n1. Session Minutes Purchases:');
    console.log(JSON.stringify(purchases, null, 2));
    
    // Get all session minutes usage
    const usage = await db.select().from(sessionMinutesUsage);
    console.log('\n2. Session Minutes Usage:');
    console.log(JSON.stringify(usage, null, 2));
    
    // Check if there are any active purchases
    const activePurchases = purchases.filter(p => p.status === 'active');
    console.log('\n3. Active Purchases Count:', activePurchases.length);
    
    if (activePurchases.length > 0) {
      const purchase = activePurchases[0];
      console.log('\n4. First Active Purchase:');
      console.log(`   - Total Units: ${purchase.totalUnits}`);
      console.log(`   - Used Units: ${purchase.usedUnits}`);
      console.log(`   - Remaining: ${purchase.totalUnits - purchase.usedUnits}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

debugSessionMinutes();