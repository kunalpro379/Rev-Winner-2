import { db } from './server/db/index.js';
import { addonPurchases, organizations } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkOrgAddons() {
  try {
    // Get your organization
    const userEmail = 'zulekyra@denipl.com';
    const orgs = await db.select().from(organizations).limit(10);
    console.log('\n=== All Organizations ===');
    orgs.forEach(org => {
      console.log(`ID: ${org.id}`);
      console.log(`Company: ${org.companyName}`);
      console.log(`Manager: ${org.licenseManagerId}`);
      console.log('---');
    });

    if (orgs.length > 0) {
      const orgId = orgs[0].id;
      console.log(`\n=== Add-ons for Organization ${orgId} ===`);
      
      const addons = await db.select()
        .from(addonPurchases)
        .where(eq(addonPurchases.organizationId, orgId));
      
      console.log(`Found ${addons.length} add-ons:`);
      addons.forEach(addon => {
        console.log(`\nAddon ID: ${addon.id}`);
        console.log(`Type: ${addon.addonType}`);
        console.log(`Status: ${addon.status}`);
        console.log(`Total Units: ${addon.totalUnits}`);
        console.log(`Used Units: ${addon.usedUnits}`);
        console.log(`Start: ${addon.startDate}`);
        console.log(`End: ${addon.endDate}`);
        console.log(`Organization ID: ${addon.organizationId}`);
        console.log(`User ID: ${addon.userId}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrgAddons();
