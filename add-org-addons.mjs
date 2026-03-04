import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addOrgAddons() {
  try {
    console.log('\n📦 Adding organization add-ons...\n');
    
    const orgId = '74c666cd-b9da-48b2-a0ae-906bd94f0843';
    const managerId = 'fc736211-0236-4203-bf7b-42f830e2f625'; // korenu@fxzig.com
    
    // Add 500 session minutes
    const sessionMinutesId = crypto.randomUUID();
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
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
    
    console.log('✅ Added 500 session minutes to organization');
    console.log(`   Expires: ${endDate.toLocaleString()}`);
    
    // Add Train Me add-on
    const trainMeId = crypto.randomUUID();
    const trainMeEndDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
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
        'train-me-addon',
        'monthly',
        '20.00',
        'USD',
        0,
        0,
        'active',
        ${startDate.toISOString()},
        ${trainMeEndDate.toISOString()},
        '{"packageName": "Train Me Add-on", "organizationPurchase": true}'::jsonb,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Added Train Me add-on to organization');
    console.log(`   Expires: ${trainMeEndDate.toLocaleString()}`);
    
    console.log('\n✅ Organization add-ons added successfully!');
    console.log('\nNow all organization members will have access to:');
    console.log('   - 500 session minutes (shared pool)');
    console.log('   - Train Me add-on');
    console.log('\nMembers should log out and log back in to see the changes.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

addOrgAddons();
