import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createKnowledgeTables() {
  console.log('🔧 Creating knowledge tables...\n');
  
  try {
    // 1. Case Studies
    console.log('1. Creating case_studies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS case_studies (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        product_codes TEXT[],
        problem_statement TEXT NOT NULL,
        solution TEXT NOT NULL,
        implementation TEXT,
        outcomes JSONB NOT NULL,
        customer_size VARCHAR(50),
        time_to_value VARCHAR(100),
        tags TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_case_studies_industry ON case_studies(industry)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_case_studies_active ON case_studies(is_active)`;
    console.log('✅ case_studies created');

    // 2. Products
    console.log('2. Creating products table...');
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT NOT NULL,
        key_features TEXT[],
        use_cases TEXT[],
        target_industries TEXT[],
        pricing_model VARCHAR(100),
        typical_price VARCHAR(100),
        implementation_time VARCHAR(100),
        integrates_with TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)`;
    console.log('✅ products created');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('case_studies', 'products')
      ORDER BY table_name
    `;
    
    console.log('\n✅ Created tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });

    console.log('\n🎉 Knowledge tables created successfully!');
    console.log('\n✅ Fixed errors:');
    console.log('  - case_studies table (for AI knowledge base)');
    console.log('  - products table (for product catalog)');
    console.log('\n✅ AI features will now work without errors!');

  } catch (error) {
    console.error('❌ Error creating knowledge tables:', error);
    process.exit(1);
  }
}

createKnowledgeTables();
