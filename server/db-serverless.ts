import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Set warm-up for Neon serverless driver
neonConfig.fetchConnectionCache = true;

let db: ReturnType<typeof makeDb>;

function makeDb() {
  // Check for required environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined. Please set the environment variable.');
  }

  // Create connection pool
  const sql = neon(process.env.DATABASE_URL);

  // Return drizzle instance
  return drizzle(sql, { schema });
}

// Create and export db with connection pooling appropriate for serverless
export function getDb() {
  if (!db) {
    db = makeDb();
  }
  return db;
}

// For compatibility with existing code
export { db as dbDirect };

// Initialize db on import
db = makeDb();
