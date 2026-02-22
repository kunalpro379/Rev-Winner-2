import fs from "fs";
import pkg from "pg";

const { Client } = pkg;

// Your DATABASE_URL
const DATABASE_URL = "postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/new?sslmode=require";

// SQL file path
const SQL_FILE = "./backup.sql"; // change to your file name

async function restoreDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting to database...");
    await client.connect();

    console.log("Reading SQL file...");
    const sql = fs.readFileSync(SQL_FILE, "utf8");

    console.log("Executing SQL...");
    await client.query(sql);

    console.log("✅ Database restored successfully!");
  } catch (err) {
    console.error("❌ Error restoring database:", err.message);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

restoreDatabase();