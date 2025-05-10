import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

// Set warm-up for Neon serverless driver
neonConfig.fetchConnectionCache = true;

// Enable logging in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Database running in development mode');
  // Debug mode not available in this version of the Neon driver
}

let db: ReturnType<typeof makeDb>;

function makeDb() {
  // Check for required environment variable
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined. Please set the environment variable.');
    throw new Error('DATABASE_URL is not defined. Please set the environment variable.');
  }

  try {
    // Create connection pool
    const sql = neon(process.env.DATABASE_URL);
    
    // Return drizzle instance
    return drizzle(sql, { schema });
  } catch (error) {
    console.error('Error creating database connection:', error);
    throw error;
  }
}

// Create and export db with connection pooling appropriate for serverless
export function getDb() {
  if (!db) {
    db = makeDb();
  }
  return db;
}

// Test database connection
export async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    return { success: true, result };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error };
  }
}

// For compatibility with existing code
export { db };

// Initialize db on import
try {
  db = makeDb();
  console.log('Database connection initialized');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Don't throw here, let the application handle the error when it tries to use the database
}
