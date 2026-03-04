import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addAddonsToDolat() {
  try {
    console.log('\n📦 Adding add-ons to dolat capital organization...\n');
    
    const orgId = 'a8f1212c-da6a-4849-9a3f-a40ae489b65b'; // dolat capital
    const managerId = '76cacf03-9e99-4098-b633-7617082f077e'; // zulekyra@denipl.com (kunal patil)
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    // Add 500 session minutes
    const sessionMinutesId = crypto.randomUUID();
    
    await sql`
      INSERT INTO addon_purchases (
        id, user_id, organization_id, addon_type, package_sku,
        billing_type, purchase_amount, currency, total_units, used_units,
        status, start_date, end_date, metadata, created_at, updated_at
      ) VALUES (
        ${sessionMinutesId},
        ${managerId},
        ${orgId},
        'session_minutes',
        '16b59eb6-e3cb-4235-9a53-df3315c4ed24',
        'one_time',
        '8.00',
        'USD',
        500,
        0,
        'active',
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        '{"packageName": "500 Minutes Package", "organizationPurchase": true}'::jsonb,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Added 500 session minutes');
    console.log(`   ID: ${sessionMinutesId}`);
    console.log(`   Expires: ${endDate.toLocaleDateString()}`);
    
    // Add Train Me add-on
    const trainMeId = crypto.randomUUID();
    
    await sql`
      INSERT INTO addon_purchases (
        id, user_id, organization_id, addon_type, package_sku,
        billing_type, purchase_amount, currency, total_units, used_units,
        status, start_date, end_date, metadata, created_at, updated_at
      ) VALUES (
        ${trainMeId},
        ${managerId},
        ${orgId},
        'train_me',
        'ab78b453-03a5-48f3-80e2-b3f00b773f4d',
        'monthly',
        '20.00',
        'USD',
        1,
        0,
        'active',
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        '{"packageName": "Train Me Add-on", "organizationPurchase": true}'::jsonb,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Added Train Me add-on');
    console.log(`   ID: ${trainMeId}`);
    console.log(`   Expires: ${endDate.toLocaleDateString()}`);
    
    // Add DAI add-on
    const daiId = crypto.randomUUID();
    
    await sql`
      INSERT INTO addon_purchases (
        id, user_id, organization_id, addon_type, package_sku,
        billing_type, purchase_amount, currency, total_units, used_units,
        status, start_date, end_date, metadata, created_at, updated_at
      ) VALUES (
        ${daiId},
        ${managerId},
        ${orgId},
        'dai',
        '9e0e2797-7274-4cf2-969c-6be53711c4c4',
        'monthly',
        '15.00',
        'USD',
        1000,
        0,
        'active',
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        '{"packageName": "DAI Tokens", "organizationPurchase": true}'::jsonb,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Added DAI add-on');
    console.log(`   ID: ${daiId}`);
    console.log(`   Expires: ${endDate.toLocaleDateString()}`);
    
    console.log('\n✅ All add-ons added successfully to dolat capital!');
    console.log('\nOrganization members now have access to:');
    console.log('   - 500 session minutes (shared pool)');
    console.log('   - Train Me add-on');
    console.log('   - DAI tokens (1000 tokens)');
    console.log('\nRefresh the License Management page to see the changes.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

addAddonsToDolat();
