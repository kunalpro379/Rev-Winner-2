import { db } from "../db";
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    
    // Test basic query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("Database connection successful:", result.rows[0]);
    
    // Check if auth_users table exists (should exist)
    const authUsersExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      );
    `);
    console.log("auth_users table exists:", authUsersExists.rows[0]?.exists);
    
    // Check if terms_and_conditions table exists
    const termsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'terms_and_conditions'
      );
    `);
    console.log("terms_and_conditions table exists:", termsExists.rows[0]?.exists);
    
    // List all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("All tables:", tables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

testConnection().then(() => {
  console.log("Test completed!");
  process.exit(0);
});