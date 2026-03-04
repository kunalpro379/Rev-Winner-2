import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function fixAddonOrganization() {
  try {
    console.log('\n🔧 Fixing add-on organization links...\n');
    
    const userId = '76cacf03-9e99-4098-b633-7617082f077e'; // zulekyra@denipl.com
    const orgId = 'a8f1212c-da6a-4849-9a3f-a40ae489b65b'; // dolat capital
    
    // Get add-ons that have teamPurchase: true but no organization_id
    const addons = await sql`
      SELECT id, addon_type, package_sku, metadata, created_at
      FROM addon_purchases
      WHERE user_id = ${userId}
        AND organization_id IS NULL
        AND metadata->>'teamPurchase' = 'true'
      ORDER BY created_at DESC
    `;
    
    console.log(`Found ${addons.length} team add-ons without organization link:\n`);
    
    if (addons.length === 0) {
      console.log('No add-ons to fix.');
      return;
    }
    
    for (const addon of addons) {
      console.log(`Fixing ${addon.addon_type} (${addon.id.substring(0, 8)}...)`);
      console.log(`   Created: ${addon.created_at?.toISOString()}`);
      
      // Update to link to organization
      await sql`
        UPDATE addon_purchases
        SET organization_id = ${orgId},
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{organizationPurchase}',
              'true'::jsonb
            ),
            updated_at = NOW()
        WHERE id = ${addon.id}
      `;
      
      console.log(`   ✅ Linked to organization ${orgId}\n`);
    }
    
    console.log('✅ All team add-ons have been linked to the organization!');
    console.log('\nRefresh the License Management page to see the changes.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

fixAddonOrganization();
