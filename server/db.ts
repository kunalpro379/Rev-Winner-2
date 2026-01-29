import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import 'dotenv/config';
// Configure Neon to use WebSocket for local development
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({ connectionString });

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
