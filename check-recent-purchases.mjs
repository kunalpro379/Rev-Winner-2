import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkRecentPurchases() {
  try {
    console.log('\n🔍 Checking recent purchases...\n');
    
    const userId = '76cacf03-9e99-4098-b633-7617082f077e'; // zulekyra@denipl.com
    
    // Check recent orders
    console.log('📋 Recent Orders (last 10):');
    const orders = await sql`
      SELECT id, user_id, package_sku, addon_type, amount, currency, 
             status, gateway_order_id, created_at, metadata
      FROM pending_orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (orders.length === 0) {
      console.log('   No orders found');
    } else {
      orders.forEach((order, i) => {
        console.log(`\n${i + 1}. Order ${order.id.substring(0, 8)}...`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Type: ${order.addon_type}`);
        console.log(`   Amount: ${order.currency} ${order.amount}`);
        console.log(`   Created: ${order.created_at?.toISOString()}`);
        if (order.metadata) {
          const meta = order.metadata;
          console.log(`   Items: ${meta.itemCount || 0}`);
          if (meta.items && Array.isArray(meta.items)) {
            meta.items.forEach((item, idx) => {
              console.log(`      ${idx + 1}. ${item.packageName} (${item.addonType}) - Qty: ${item.quantity || 1}, Mode: ${item.purchaseMode || 'user'}`);
            });
          }
        }
      });
    }
    
    // Check addon purchases
    console.log('\n\n📦 Recent Add-on Purchases (last 10):');
    const addons = await sql`
      SELECT id, user_id, organization_id, addon_type, package_sku, 
             status, total_units, used_units, purchase_amount, currency,
             start_date, end_date, created_at, metadata
      FROM addon_purchases
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (addons.length === 0) {
      console.log('   No add-on purchases found');
    } else {
      addons.forEach((addon, i) => {
        console.log(`\n${i + 1}. ${addon.addon_type}`);
        console.log(`   ID: ${addon.id}`);
        console.log(`   Organization: ${addon.organization_id || 'None (personal)'}`);
        console.log(`   Status: ${addon.status}`);
        console.log(`   Units: ${addon.used_units}/${addon.total_units}`);
        console.log(`   Amount: ${addon.currency} ${addon.purchase_amount}`);
        console.log(`   Created: ${addon.created_at?.toISOString()}`);
        if (addon.metadata) {
          console.log(`   Metadata:`, addon.metadata);
        }
      });
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkRecentPurchases();
