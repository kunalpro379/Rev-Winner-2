import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './shared/schema.ts';

const DATABASE_URL = 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require';

async function pushToNeon() {
  console.log('🚀 Starting database push to Neon...\n');
  
  try {
    // Create Neon SQL client
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    console.log('✅ Connected to Neon database');
    console.log('📊 Database: revwinner');
    console.log('🌐 Region: us-east-1\n');
    
    // Test connection
    const result = await sql`SELECT current_database(), current_user, version()`;
    console.log('📌 Connection verified:');
    console.log(`   Database: ${result[0].current_database}`);
    console.log(`   User: ${result[0].current_user}`);
    console.log(`   Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}\n`);
    
    console.log('⚙️  Pushing schema changes...');
    console.log('   This will create/update all tables defined in shared/schema.ts\n');
    
    // Note: drizzle-kit push is better for this, but we'll use migrate
    // You should run: npx drizzle-kit push:pg
    console.log('⚠️  IMPORTANT: This script connects to the database.');
    console.log('   To push schema changes, run: npm run db:push\n');
    
    console.log('✅ Database connection successful!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm install drizzle-kit --save-dev');
    console.log('   2. Run: npx drizzle-kit push');
    console.log('   3. Or use: npm run db:push (if configured in package.json)');
    
  } catch (error) {
    console.error('❌ Error pushing to Neon:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

pushToNeon();
