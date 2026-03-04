import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkUserOrgAddons() {
  try {
    console.log('\n🔍 Checking user organization and add-ons...\n');
    
    const userEmail = 'zulekyra@denipl.com'; // kunal patil
    
    // Get user
    const users = await sql`
      SELECT id, email, first_name, last_name, role
      FROM auth_users
      WHERE email = ${userEmail}
    `;
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    console.log('👤 User:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role
    });
    
    // Get user's organization (as primary manager)
    const orgs = await sql`
      SELECT id, company_name, billing_email, primary_manager_id, status
      FROM organizations
      WHERE primary_manager_id = ${user.id}
    `;
    
    if (orgs.length === 0) {
      console.log('\n❌ No organization found where user is primary manager');
      
      // Check if user is a member of any organization
      const memberships = await sql`
        SELECT om.*, o.company_name
        FROM organization_memberships om
        JOIN organizations o ON om.organization_id = o.id
        WHERE om.user_id = ${user.id}
      `;
      
      if (memberships.length > 0) {
        console.log('\n📋 User is a member of these organizations:');
        memberships.forEach(m => {
          console.log(`   - ${m.company_name} (${m.organization_id})`);
        });
      }
      return;
    }
    
    const org = orgs[0];
    console.log('\n🏢 Organization:', {
      id: org.id,
      name: org.company_name,
      email: org.billing_email,
      status: org.status
    });
    
    // Get organization add-ons
    const addons = await sql`
      SELECT id, addon_type, package_sku, status, total_units, used_units,
             purchase_amount, currency, start_date, end_date
      FROM addon_purchases
      WHERE organization_id = ${org.id}
      ORDER BY created_at DESC
    `;
    
    console.log(`\n📦 Add-ons for organization (${addons.length} found):`);
    if (addons.length === 0) {
      console.log('   No add-ons found');
    } else {
      addons.forEach(addon => {
        console.log(`\n   ${addon.addon_type}:`);
        console.log(`      ID: ${addon.id}`);
        console.log(`      SKU: ${addon.package_sku}`);
        console.log(`      Status: ${addon.status}`);
        console.log(`      Units: ${addon.used_units}/${addon.total_units}`);
        console.log(`      Price: ${addon.currency} ${addon.purchase_amount}`);
        console.log(`      Period: ${addon.start_date?.toISOString().split('T')[0]} to ${addon.end_date?.toISOString().split('T')[0]}`);
      });
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkUserOrgAddons();
