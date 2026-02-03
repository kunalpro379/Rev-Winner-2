import { db } from "../db";
import { sql } from "drizzle-orm";

async function createTermsTable() {
  try {
    console.log("Starting terms_and_conditions table creation...");
    
    // Check if table already exists
    console.log("Checking if table exists...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'terms_and_conditions'
      );
    `);
    
    console.log("Table exists check result:", tableExists.rows[0]);
    
    if (tableExists.rows[0]?.exists) {
      console.log("terms_and_conditions table already exists. Skipping creation.");
      return;
    }
    
    console.log("Creating terms_and_conditions table...");
    // Create the table
    const createResult = await db.execute(sql`
      CREATE TABLE "terms_and_conditions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" varchar(255) DEFAULT 'Terms & Conditions' NOT NULL,
        "content" text NOT NULL,
        "version" varchar(20) DEFAULT '1.0' NOT NULL,
        "is_active" boolean DEFAULT true,
        "last_modified_by" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    
    console.log("Table created! Result:", createResult.command);
    
    // Create indexes
    console.log("Creating indexes...");
    await db.execute(sql`
      CREATE INDEX "idx_terms_active" ON "terms_and_conditions" USING btree ("is_active");
    `);
    console.log("Created idx_terms_active index");
    
    await db.execute(sql`
      CREATE INDEX "idx_terms_version" ON "terms_and_conditions" USING btree ("version");
    `);
    console.log("Created idx_terms_version index");
    
    // Add foreign key constraint
    console.log("Adding foreign key constraint...");
    await db.execute(sql`
      ALTER TABLE "terms_and_conditions" 
      ADD CONSTRAINT "terms_and_conditions_last_modified_by_auth_users_id_fk" 
      FOREIGN KEY ("last_modified_by") REFERENCES "public"."auth_users"("id") 
      ON DELETE no action ON UPDATE no action;
    `);
    console.log("Foreign key constraint added");
    
    // Verify table was created
    const verifyExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'terms_and_conditions'
      );
    `);
    
    console.log("Final verification - table exists:", verifyExists.rows[0]?.exists);
    console.log("terms_and_conditions table created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating terms_and_conditions table:", error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTermsTable()
    .then(() => {
      console.log("🎉 Table creation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { createTermsTable };