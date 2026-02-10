import { db } from './server/db.ts';
import { pendingOrders, cartItems, addonPurchases } from './shared/schema.ts';
import { eq, desc } from 'drizzle-orm';

/**
 * Debug script to investigate the cart discount bug
 * Run with: node debug-cart-purchase.mjs
 */

async function debugCartPurchase() {
  try {
    console.log('🔍 Investigating cart discount bug...\n');

    // Find the most recent completed cart order
    const recentOrders = await db
      .select()
      .from(pendingOrders)
      .where(eq(pendingOrders.addonType, 'cart_checkout'))
      .orderBy(desc(pendingOrders.createdAt))
      .limit(5);

    if (recentOrders.length === 0) {
      console.log('❌ No cart orders found');
      return;
    }

    console.log(`Found ${recentOrders.length} recent cart orders:\n`);

    for (const order of recentOrders) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Order ID: ${order.id}`);
      console.log(`Gateway Order ID: ${order.gatewayOrderId}`);
      console.log(`Status: ${order.status}`);
      console.log(`Amount: ${order.amount} ${order.currency}`);
      console.log(`Created: ${order.createdAt}`);
      console.log(`User ID: ${order.userId}`);
      
      const metadata = order.metadata;
      if (metadata) {
        console.log('\n📦 Order Metadata:');
        console.log(`  Item Count: ${metadata.itemCount || 'N/A'}`);
        console.log(`  Subtotal: ${metadata.subtotal || 'N/A'}`);
        console.log(`  Discount: ${metadata.discount || 'N/A'}`);
        console.log(`  GST: ${metadata.gstAmount || 'N/A'}`);
        console.log(`  Total: ${metadata.total || 'N/A'}`);
        console.log(`  Final Amount: ${metadata.finalAmount || 'N/A'}`);
        console.log(`  Original Currency: ${metadata.originalCurrency || 'N/A'}`);
        console.log(`  Final Currency: ${metadata.finalCurrency || 'N/A'}`);
        console.log(`  Conversion Rate: ${metadata.conversionRate || 'N/A'}`);
        
        if (metadata.items && Array.isArray(metadata.items)) {
          console.log('\n📋 Cart Items:');
          metadata.items.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.packageName}`);
            console.log(`     SKU: ${item.packageSku}`);
            console.log(`     Type: ${item.addonType}`);
            console.log(`     Base Price: ${item.basePrice} ${item.currency}`);
            console.log(`     Quantity: ${item.quantity}`);
          });
        }
        
        if (metadata.perItemPromoCodes && Array.isArray(metadata.perItemPromoCodes)) {
          console.log('\n🎟️  Promo Codes Applied:');
          metadata.perItemPromoCodes.forEach((promo, idx) => {
            console.log(`  ${idx + 1}. Code: ${promo.promoCodeCode || 'None'}`);
            console.log(`     Discount: ${promo.appliedDiscountAmount || '0'}`);
            console.log(`     Cart Item ID: ${promo.cartItemId}`);
          });
        }
      }
      
      // Find associated addon purchases
      const purchases = await db
        .select()
        .from(addonPurchases)
        .where(eq(addonPurchases.userId, order.userId))
        .orderBy(desc(addonPurchases.createdAt))
        .limit(10);
      
      const orderPurchases = purchases.filter(p => {
        const pMetadata = p.metadata as any;
        return pMetadata && pMetadata.cartOrderId === order.id;
      });
      
      if (orderPurchases.length > 0) {
        console.log('\n💰 Associated Purchases:');
        orderPurchases.forEach((purchase, idx) => {
          const pMetadata = purchase.metadata as any;
          console.log(`  ${idx + 1}. ${pMetadata?.packageName || purchase.packageSku}`);
          console.log(`     Type: ${purchase.addonType}`);
          console.log(`     Purchase Amount: ${purchase.purchaseAmount} ${purchase.currency}`);
          console.log(`     Status: ${purchase.status}`);
          if (pMetadata?.actualPaidAmount) {
            console.log(`     Actual Paid: ${pMetadata.actualPaidAmount} ${pMetadata.actualCurrency || purchase.currency}`);
          }
        });
      }
      
      console.log('\n');
    }

    console.log('✅ Debug complete');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugCartPurchase();
