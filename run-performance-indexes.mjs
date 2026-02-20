import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import ws from 'ws';

// Load environment variables
dotenv.config();

// Configure Neon for local development
neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runIndexMigration() {
  console.log('🚀 Starting performance index migration...\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('📊 Connecting to database...');
  
  // Create Neon pool
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Read SQL file
    const sqlPath = join(__dirname, 'add-performance-indexes.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    console.log('📝 Executing index creation SQL...\n');
    
    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.toLowerCase().includes('create index') || 
          statement.toLowerCase().includes('analyze') ||
          statement.toLowerCase().includes('select')) {
        await pool.query(statement);
      }
    }
    
    console.log('\n✅ Performance indexes created successfully!');
    console.log('\n📈 Expected improvements:');
    console.log('   - /api/enterprise/overview: 2000ms → ~300ms (85% faster)');
    console.log('   - /api/cart: 1000ms → ~100ms (90% faster)');
    console.log('   - /api/auth/me: 1300ms → ~200ms (85% faster)');
    console.log('   - /api/enterprise/assign: 4600ms → ~500ms (89% faster)');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

runIndexMigration();
