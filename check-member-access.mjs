import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkMemberAccess() {
  try {
    console.log('\n🔍 Checking member access...\n');
    
    const memberEmail = 'rogijima@forexzig.com';
    
    // Get the member user
    const [member] = await sql`
      SELECT id, email, first_name, last_name, role
      FROM auth_users
      WHERE email = ${memberEmail}
    `;
    
    if (!member) {
      console.log('❌ Member not found');
      return;
    }
    
    console.log('👤 Member:');
    console.log(`   Name: ${member.first_name} ${member.last_name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Role: ${member.role}`);
    console.log(`   User ID: ${member.id}`);
    
    // Check organization membership
    const [membership] = await sql`
      SELECT om.id, om.organization_id, om.role, om.status, o.company_name
      FROM organization_memberships om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = ${member.id}
    `;
    
    if (!membership) {
      console.log('\n❌ No organization membership found');
      return;
    }
    
    console.log('\n🏢 Organization Membership:');
    console.log(`   Organization: ${membership.company_name}`);
    console.log(`   Role: ${membership.role}`);
    console.log(`   Status: ${membership.status}`);
    console.log(`   Org ID: ${membership.organization_id}`);
    
    // Check license assignment
    const [assignment] = await sql`
      SELECT id, license_package_id, assigned_by, status, assigned_at
      FROM license_assignments
      WHERE user_id = ${member.id} AND status = 'active'
    `;
    
    if (assignment) {
      console.log('\n✅ License Assignment:');
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Assigned: ${new Date(assignment.assigned_at).toLocaleString()}`);
    } else {
      console.log('\n❌ No active license assignment');
    }
    
    // Check organization add-ons
    const orgAddons = await sql`
      SELECT addon_type, total_units, used_units, status, start_date, end_date
      FROM addon_purchases
      WHERE organization_id = ${membership.organization_id} AND status = 'active'
    `;
    
    console.log('\n📦 Organization Add-ons:');
    if (orgAddons.length === 0) {
      console.log('   ❌ No organization add-ons found');
    } else {
      orgAddons.forEach((addon, index) => {
        console.log(`\n   ${index + 1}. ${addon.addon_type}`);
        console.log(`      Total Units: ${addon.total_units}`);
        console.log(`      Used Units: ${addon.used_units}`);
        console.log(`      Remaining: ${addon.total_units - addon.used_units}`);
        console.log(`      Status: ${addon.status}`);
        if (addon.end_date) {
          console.log(`      Expires: ${new Date(addon.end_date).toLocaleString()}`);
        }
      });
    }
    
    // Check personal add-ons
    const personalAddons = await sql`
      SELECT addon_type, total_units, used_units, status
      FROM addon_purchases
      WHERE user_id = ${member.id} AND organization_id IS NULL AND status = 'active'
    `;
    
    console.log('\n📦 Personal Add-ons:');
    if (personalAddons.length === 0) {
      console.log('   ❌ No personal add-ons');
    } else {
      personalAddons.forEach((addon, index) => {
        console.log(`\n   ${index + 1}. ${addon.addon_type}: ${addon.total_units} units`);
      });
    }
    
    console.log('\n✅ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkMemberAccess();
