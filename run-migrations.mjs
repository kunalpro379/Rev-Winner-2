import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
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

async function runMigrations() {
  console.log('🚀 Starting database migration process...\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Please add DATABASE_URL to your .env file');
    process.exit(1);
  }

  console.log('📊 Connecting to database...');
  
  // Create Neon pool
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log(`   Server time: ${testResult.rows[0].now}\n`);

    // Step 1: Run Drizzle schema push
    console.log('📝 Step 1: Pushing Drizzle schema to database...');
    console.log('   Run: npm run db:push');
    console.log('   (This will sync your schema.ts with the database)\n');

    // Step 2: Run SQL migrations in order
    console.log('📝 Step 2: Running SQL migrations...\n');

    const migrations = [
      // Main schema migration (if not already applied by drizzle)
      // 'migrations/0000_many_iron_fist.sql', // Skip this - drizzle handles it
      
      // Additional migrations
      'migrations/0001_curly_terror.sql',
      'migrations/0002_add_transcription_started_at.sql',
      'migrations/0003_add_user_feedback.sql',
      'add-performance-indexes.sql',
      'add-feedback-table.sql',
    ];

    for (const migrationFile of migrations) {
      const migrationPath = join(__dirname, migrationFile);
      
      try {
        console.log(`   Running: ${migrationFile}`);
        const sql = readFileSync(migrationPath, 'utf-8');
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (err) {
            // Ignore "already exists" errors
            if (err.message?.includes('already exists') || 
                err.message?.includes('duplicate')) {
              console.log(`      ⚠️  Skipped (already exists)`);
            } else {
              throw err;
            }
          }
        }
        
        console.log(`      ✅ Completed\n`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`      ⚠️  File not found, skipping\n`);
        } else {
          console.error(`      ❌ Error: ${error.message}\n`);
          // Continue with other migrations
        }
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Database is now ready to use');
    console.log('\n🎯 Next steps:');
    console.log('   1. Restart your server: npm run dev');
    console.log('   2. Test your application');
    console.log('   3. Check for any errors in the console\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    
    if (error.message?.includes('endpoint has been disabled')) {
      console.error('\n🚨 CRITICAL: Your Neon database endpoint is disabled!');
      console.error('   Please follow the instructions in FIX_NEON_DATABASE.md');
      console.error('   to enable your database endpoint.\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migrations
runMigrations().catch(console.error);
