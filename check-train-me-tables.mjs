import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  console.log('🔍 Checking Train Me related tables...\n');

  try {
    // Check addon_purchases table
    console.log('1️⃣ Checking addon_purchases table...');
    const addonPurchases = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'addon_purchases'
      ORDER BY ordinal_position;
    `;
    console.log(`✅ addon_purchases table exists with ${addonPurchases.length} columns:`);
    addonPurchases.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check enterprise_user_assignments table
    console.log('\n2️⃣ Checking enterprise_user_assignments table...');
    const enterpriseAssignments = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'enterprise_user_assignments'
      ORDER BY ordinal_position;
    `;
    console.log(`✅ enterprise_user_assignments table exists with ${enterpriseAssignments.length} columns:`);
    enterpriseAssignments.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check if trainMeEnabled column exists
    const hasTrainMeEnabled = enterpriseAssignments.some(col => col.column_name === 'train_me_enabled');
    if (hasTrainMeEnabled) {
      console.log('   ✅ train_me_enabled column exists');
    } else {
      console.log('   ❌ train_me_enabled column is MISSING');
    }

    // Check organization_addons table
    console.log('\n3️⃣ Checking organization_addons table...');
    const orgAddons = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'organization_addons'
      ORDER BY ordinal_position;
    `;
    if (orgAddons.length > 0) {
      console.log(`✅ organization_addons table exists with ${orgAddons.length} columns:`);
      orgAddons.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ organization_addons table does NOT exist');
    }

    console.log('\n✅ All checks complete!');
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  }
}

checkTables().catch(console.error);
