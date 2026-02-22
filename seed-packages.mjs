import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

console.log('🌱 Starting package seeding...\n');

// Subscription Plans Data
const subscriptionPlans = [
  {
    id: 'd4ea952f-20f8-4cfc-bcef-ef04d6faad3b',
    name: '6 Months Plan',
    price: '220',
    currency: 'USD',
    billing_interval: '6-months',
    features: JSON.stringify(["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "Hello"]),
    is_active: true,
    razorpay_plan_id: 'plan_6month_200',
    listed_price: null,
    available_until: null,
    required_addons: JSON.stringify([]),
    published_on_website: true
  },
  {
    id: '61a2e346-c35f-4395-8996-b3c4cfe8fcd8',
    name: '3 Months Plan',
    price: '149',
    currency: 'USD',
    billing_interval: 'one_time',
    features: JSON.stringify(["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "90 days access", "All AI features included", "Priority support", "Save $50"]),
    is_active: true,
    razorpay_plan_id: null,
    listed_price: '199',
    available_until: null,
    required_addons: JSON.stringify([]),
    published_on_website: true
  },
  {
    id: 'e62f2310-d1dd-4f43-ba48-c63ae592d0f9',
    name: '12 Months Plan',
    price: '399',
    currency: 'USD',
    billing_interval: '1-year',
    features: JSON.stringify(["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]),
    is_active: true,
    razorpay_plan_id: 'plan_yearly_399',
    listed_price: '799',
    available_until: null,
    required_addons: JSON.stringify([]),
    published_on_website: true
  },
  {
    id: '689ee4f4-7ee7-4e5a-8fe7-edff014b30cd',
    name: '36 Months Plan',
    price: '499',
    currency: 'USD',
    billing_interval: '3-years',
    features: JSON.stringify(["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]),
    is_active: true,
    razorpay_plan_id: 'plan_3year_499',
    listed_price: '999',
    available_until: null,
    required_addons: JSON.stringify([]),
    published_on_website: true
  }
];

// Addons Data
const addons = [
  {
    id: 'f4fdc254-fe49-4de7-890a-0a703418609d',
    slug: 'dai-lite-monthly',
    display_name: 'DAI Lite (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '10',
    currency: 'USD',
    features: JSON.stringify(["100K AI tokens per month", "Access to all AI models", "Perfect for light usage", "Monthly renewal"]),
    metadata: JSON.stringify({"description": "DAI Lite: 100K tokens per month", "total_tokens": 100000, "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: 'ab78b453-03a5-48f3-80e2-b3f00b773f4d',
    slug: 'dai-moderate-monthly',
    display_name: 'DAI Moderate (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '25',
    currency: 'USD',
    features: JSON.stringify(["300K AI tokens per month", "Access to all AI models", "Great for regular usage", "Monthly renewal"]),
    metadata: JSON.stringify({"description": "DAI Moderate: 300K tokens per month", "total_tokens": 300000, "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '9a4a9b1b-e52f-4c7b-b207-f62c303002c6',
    slug: 'dai-professional-monthly',
    display_name: 'DAI Professional (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '50',
    currency: 'USD',
    features: JSON.stringify(["750K AI tokens per month", "Access to all AI models", "Ideal for power users", "Monthly renewal"]),
    metadata: JSON.stringify({"description": "DAI Professional: 750K tokens per month", "total_tokens": 750000, "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '9e0e2797-7274-4cf2-969c-6be53711c4c4',
    slug: 'dai-power-monthly',
    display_name: 'DAI Power (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '100',
    currency: 'USD',
    features: JSON.stringify(["1.5M AI tokens per month", "Access to all AI models", "For heavy users", "Monthly renewal"]),
    metadata: JSON.stringify({"description": "DAI Power: 1.5M tokens per month", "total_tokens": 1500000, "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: 'f92de33c-cf9b-45ff-951b-9b576a2aed41',
    slug: 'dai-enterprise-monthly',
    display_name: 'DAI Enterprise (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '200',
    currency: 'USD',
    features: JSON.stringify(["3M AI tokens per month", "Access to all AI models", "Enterprise-grade usage", "Monthly renewal"]),
    metadata: JSON.stringify({"description": "DAI Enterprise: 3M tokens per month", "total_tokens": 3000000, "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '258106b4-6b02-4af3-8b1d-af77d7af29c1',
    slug: 'train-me',
    display_name: 'Train Me Add-on (Monthly)',
    type: 'service',
    billing_interval: 'monthly',
    pricing_tiers: null,
    flat_price: '20',
    currency: 'USD',
    features: JSON.stringify(["Create up to 5 domain expertise profiles", "Upload up to 100 documents per domain", "Support for PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT", "Train AI with specific product knowledge and pricing", "Get domain-specific answers during sales calls"]),
    metadata: JSON.stringify({"description": "Train AI on your specific domain and product knowledge", "validity_days": 30}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '16b59eb6-e3cb-4235-9a53-df3315c4ed24',
    slug: 'session-minutes-500',
    display_name: '500 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '8',
    currency: 'USD',
    features: JSON.stringify(["500 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 500}),
    is_active: true,
    published_on_website: true
  },
  {
    id: 'f19e48b0-2bbc-4a75-9d0e-73afa53b09d3',
    slug: 'session-minutes-1000',
    display_name: '1000 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '16',
    currency: 'USD',
    features: JSON.stringify(["1000 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 1000}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '0297d197-2c45-410e-ad94-4ec73e77c79b',
    slug: 'session-minutes-1500',
    display_name: '1500 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '24',
    currency: 'USD',
    features: JSON.stringify(["1500 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 1500}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '280dc216-bf5e-4ce4-9ade-8083dc67ec2d',
    slug: 'session-minutes-2000',
    display_name: '2000 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '32',
    currency: 'USD',
    features: JSON.stringify(["2000 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 2000}),
    is_active: true,
    published_on_website: true
  },
  {
    id: '4783537e-de2a-4a2a-a8e9-1194887d1f1e',
    slug: 'session-minutes-3000',
    display_name: '3000 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '48',
    currency: 'USD',
    features: JSON.stringify(["3000 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 3000}),
    is_active: true,
    published_on_website: true
  },
  {
    id: 'ac84f933-15d3-4ff2-9a27-8b60c0f1858b',
    slug: 'session-minutes-5000',
    display_name: '5000 Minutes Package',
    type: 'usage_bundle',
    billing_interval: 'one-time',
    pricing_tiers: null,
    flat_price: '80',
    currency: 'USD',
    features: JSON.stringify(["5000 session minutes", "Never expires", "One-time purchase"]),
    metadata: JSON.stringify({"minutes": 5000}),
    is_active: true,
    published_on_website: true
  }
];

async function seedPackages() {
  try {
    // Seed Subscription Plans
    console.log('📦 Seeding Subscription Plans...');
    for (const plan of subscriptionPlans) {
      try {
        await sql`
          INSERT INTO subscription_plans (
            id, name, price, currency, billing_interval, features, 
            is_active, razorpay_plan_id, listed_price, available_until, 
            required_addons, published_on_website, created_at, updated_at
          ) VALUES (
            ${plan.id}, ${plan.name}, ${plan.price}, ${plan.currency}, 
            ${plan.billing_interval}, ${plan.features}::jsonb, ${plan.is_active}, 
            ${plan.razorpay_plan_id}, ${plan.listed_price}, ${plan.available_until}, 
            ${plan.required_addons}::jsonb, ${plan.published_on_website}, 
            NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            features = EXCLUDED.features,
            is_active = EXCLUDED.is_active,
            published_on_website = EXCLUDED.published_on_website,
            updated_at = NOW()
        `;
        console.log(`  ✓ ${plan.name} - $${plan.price} ${plan.currency}`);
      } catch (err) {
        console.error(`  ✗ Failed to seed ${plan.name}:`, err.message);
      }
    }

    // Seed Addons
    console.log('\n🔌 Seeding Addons...');
    for (const addon of addons) {
      try {
        await sql`
          INSERT INTO addons (
            id, slug, display_name, type, billing_interval, pricing_tiers,
            flat_price, currency, features, metadata, is_active, 
            published_on_website, created_at, updated_at
          ) VALUES (
            ${addon.id}, ${addon.slug}, ${addon.display_name}, ${addon.type},
            ${addon.billing_interval}, ${addon.pricing_tiers}, ${addon.flat_price},
            ${addon.currency}, ${addon.features}::jsonb, ${addon.metadata}::jsonb,
            ${addon.is_active}, ${addon.published_on_website}, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            flat_price = EXCLUDED.flat_price,
            features = EXCLUDED.features,
            metadata = EXCLUDED.metadata,
            is_active = EXCLUDED.is_active,
            published_on_website = EXCLUDED.published_on_website,
            updated_at = NOW()
        `;
        console.log(`  ✓ ${addon.display_name} - $${addon.flat_price} ${addon.currency}`);
      } catch (err) {
        console.error(`  ✗ Failed to seed ${addon.display_name}:`, err.message);
      }
    }

    console.log('\n✅ Package seeding completed!\n');
    
    // Display summary
    console.log('📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 SUBSCRIPTION PLANS:');
    subscriptionPlans.forEach(p => {
      console.log(`  • ${p.name}: $${p.price} (${p.billing_interval})`);
    });
    
    console.log('\n🔌 DAI ADDONS (AI Token Packages):');
    addons.filter(a => a.type === 'service' && a.slug.startsWith('dai-')).forEach(a => {
      const tokens = JSON.parse(a.metadata).total_tokens;
      console.log(`  • ${a.display_name}: $${a.flat_price} - ${(tokens/1000).toFixed(0)}K tokens`);
    });
    
    console.log('\n📚 TRAIN ME ADDON:');
    const trainMe = addons.find(a => a.slug === 'train-me');
    console.log(`  • ${trainMe.display_name}: $${trainMe.flat_price}/month`);
    
    console.log('\n⏱️ SESSION MINUTES BUNDLES:');
    addons.filter(a => a.type === 'usage_bundle').forEach(a => {
      const minutes = JSON.parse(a.metadata).minutes;
      console.log(`  • ${minutes} minutes: $${a.flat_price} (${(parseFloat(a.flat_price)/minutes*100).toFixed(2)}¢/min)`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding packages:', error);
    process.exit(1);
  }
}

seedPackages();
