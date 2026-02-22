import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function checkCartTable() {
  console.log('\n🔍 Checking cart_items table...\n');
  
  try {
    // Check if table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cart_items'
    `;
    
    if (tables.length === 0) {
      console.log('❌ cart_items table does NOT exist!');
      console.log('\n📋 Creating cart_items table...\n');
      
      // Create the table based on schema
      await sql`
        CREATE TABLE cart_items (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          package_sku VARCHAR(100) NOT NULL,
          addon_type VARCHAR(50) NOT NULL,
          package_name VARCHAR(255) NOT NULL,
          base_price VARCHAR(20) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'USD',
          quantity INTEGER NOT NULL DEFAULT 1,
          purchase_mode VARCHAR(20) DEFAULT 'user',
          team_manager_name VARCHAR(255),
          team_manager_email VARCHAR(255),
          company_name VARCHAR(255),
          promo_code_id VARCHAR,
          promo_code_code VARCHAR(50),
          applied_discount_amount VARCHAR(20),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      console.log('✅ cart_items table created');
      
      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_package_sku ON cart_items(package_sku)`;
      
      console.log('✅ Indexes created');
    } else {
      console.log('✅ cart_items table exists');
    }
    
    // Show table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cart_items'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Check if there are any cart items
    const count = await sql`SELECT COUNT(*) as count FROM cart_items`;
    console.log(`\n📊 Total cart items in database: ${count[0].count}`);
    
    // Show sample cart items if any
    if (parseInt(count[0].count) > 0) {
      const items = await sql`
        SELECT id, user_id, package_sku, package_name, quantity, purchase_mode, added_at
        FROM cart_items
        ORDER BY added_at DESC
        LIMIT 5
      `;
      
      console.log('\n📦 Recent cart items:');
      items.forEach(item => {
        console.log(`   - ${item.package_name} (${item.package_sku}) x${item.quantity} - Mode: ${item.purchase_mode} - Added: ${item.added_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkCartTable()
  .then(() => {
    console.log('\n✅ Check completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
