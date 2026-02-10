import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function investigateRevenueLeak() {
  console.log('🔍 Investigating Revenue Leak - Add-ons Without Payment Records\n');
  
  try {
    // Get all add-on purchases without payment reference
    const addonsWithoutPayment = await sql`
      SELECT 
        id,
        user_id,
        addon_slug,
        amount_paid,
        currency,
        status,
        created_at,
        expires_at
      FROM addon_purchases
      WHERE gateway_transaction_id IS NULL
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Found ${addonsWithoutPayment.length} add-on purchases without payment reference\n`);
    
    if (addonsWithoutPayment.length === 0) {
      console.log('✅ No revenue leak detected!');
      return;
    }
    
    // Group by user
    const byUser = {};
    addonsWithoutPayment.forEach(addon => {
      if (!byUser[addon.user_id]) {
        byUser[addon.user_id] = [];
      }
      byUser[addon.user_id].push(addon);
    });
    
    console.log(`👥 Affected users: ${Object.keys(byUser).length}\n`);
    
    // Get user details
    for (const userId of Object.keys(byUser)) {
      const [user] = await sql`
        SELECT id, email, username, role, status, created_at
        FROM auth_users
        WHERE id = ${userId}
      `;
      
      const addons = byUser[userId];
      const totalAmount = addons.reduce((sum, a) => sum + parseFloat(a.amount_paid || 0), 0);
      
      console.log(`\n👤 User: ${user?.email || 'Unknown'} (${user?.username || 'N/A'})`);
      console.log(`   ID: ${userId}`);
      console.log(`   Role: ${user?.role || 'N/A'}`);
      console.log(`   Status: ${user?.status || 'N/A'}`);
      console.log(`   Account Created: ${user?.created_at || 'N/A'}`);
      console.log(`   Total Unpaid: ${totalAmount.toFixed(2)} (${addons.length} purchases)`);
      
      // Check if there are any payments for this user
      const payments = await sql`
        SELECT 
          id,
          razorpay_payment_id,
          amount,
          currency,
          status,
          created_at
        FROM payments
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      if (payments.length > 0) {
        console.log(`   💳 Has ${payments.length} payment records (showing last 5):`);
        payments.forEach(p => {
          console.log(`      - ${p.amount} ${p.currency} (${p.status}) - ${p.created_at}`);
        });
      } else {
        console.log(`   ⚠️  NO payment records found for this user`);
      }
      
      console.log(`   📦 Unpaid add-ons:`);
      addons.forEach(addon => {
        console.log(`      - ${addon.addon_slug}: ${addon.amount_paid} ${addon.currency} (${addon.status})`);
        console.log(`        ID: ${addon.id}`);
        console.log(`        Created: ${addon.created_at}`);
        console.log(`        Expires: ${addon.expires_at || 'N/A'}`);
      });
    }
    
    // Summary and recommendations
    console.log('\n\n📋 SUMMARY\n');
    console.log(`Total unpaid add-ons: ${addonsWithoutPayment.length}`);
    console.log(`Affected users: ${Object.keys(byUser).length}`);
    
    const totalRevenue = addonsWithoutPayment.reduce((sum, a) => {
      const amount = parseFloat(a.amount_paid || 0);
      // Convert to USD for comparison (rough estimate: 1 USD = 83 INR)
      const usdAmount = a.currency === 'INR' ? amount / 83 : amount;
      return sum + usdAmount;
    }, 0);
    
    console.log(`Estimated revenue at risk: ~$${totalRevenue.toFixed(2)} USD`);
    
    // Check for test patterns
    const testPatterns = addonsWithoutPayment.filter(a => 
      parseFloat(a.amount_paid) === 0 || 
      parseFloat(a.amount_paid) < 10 ||
      a.status === 'pending'
    );
    
    console.log(`\n🧪 Possible test data: ${testPatterns.length} records`);
    
    // Recommendations
    console.log('\n\n💡 RECOMMENDATIONS\n');
    
    if (testPatterns.length === addonsWithoutPayment.length) {
      console.log('✅ All records appear to be test data (0 or low amounts)');
      console.log('   Action: Safe to delete these records');
      console.log('   SQL: DELETE FROM addon_purchases WHERE gateway_transaction_id IS NULL;');
    } else {
      console.log('⚠️  Mix of test and potentially real purchases detected');
      console.log('   Action: Manual review required');
      console.log('   Steps:');
      console.log('   1. Contact users to verify purchases');
      console.log('   2. Check payment gateway logs');
      console.log('   3. Either link to payments or revoke access');
    }
    
    console.log('\n🔒 PREVENTION\n');
    console.log('Add database constraint to prevent future issues:');
    console.log('SQL: ALTER TABLE addon_purchases ADD CONSTRAINT addon_purchases_payment_required');
    console.log('     CHECK (gateway_transaction_id IS NOT NULL OR status IN (\'pending\', \'failed\', \'refunded\'));');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

investigateRevenueLeak();
