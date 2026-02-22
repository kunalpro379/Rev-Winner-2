import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixEnterpriseAssignments() {
  try {
    console.log('\n⚙️  Adding organization_id column to enterprise_user_assignments...\n');
    
    // Add organization_id column
    await sql`
      ALTER TABLE enterprise_user_assignments 
      ADD COLUMN IF NOT EXISTS organization_id VARCHAR REFERENCES organizations(id) ON DELETE CASCADE
    `;
    
    console.log('✅ Added organization_id column\n');
    
    // Verify columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'enterprise_user_assignments'
      ORDER BY ordinal_position
    `;
    
    console.log('🎉 enterprise_user_assignments table structure:\n');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

fixEnterpriseAssignments();
