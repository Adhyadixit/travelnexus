import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema'; // Ensure this path alias is correctly resolved in Vercel
import { sql } from 'drizzle-orm';

console.log('db-serverless.ts: Module loading...');

neonConfig.fetchConnectionCache = true; // Recommended for serverless environments

const enableDebugLogs = process.env.NODE_ENV !== 'production' && process.env.DEBUG_DB === 'true';

if (enableDebugLogs) {
  console.log('db-serverless.ts: Database debug logging enabled.');
}

let dbInstance: ReturnType<typeof makeDb>;

function makeDb() {
  console.log('db-serverless.ts: makeDb() called.');
  if (!process.env.DATABASE_URL) {
    console.error('db-serverless.ts: ERROR - DATABASE_URL is not defined.');
    throw new Error('DATABASE_URL is not defined. Critical configuration missing.');
  }
  console.log(`db-serverless.ts: DATABASE_URL found (prefix: ${process.env.DATABASE_URL.substring(0,30)}...).`);

  try {
    const neonConnection = neon(process.env.DATABASE_URL);
    console.log('db-serverless.ts: Neon connection object created.');
    const drizzleInstance = drizzle(neonConnection, { schema, logger: enableDebugLogs });
    console.log('db-serverless.ts: Drizzle instance created.');
    return drizzleInstance;
  } catch (error) {
    console.error('db-serverless.ts: ERROR - Failed to create Drizzle instance in makeDb:', error);
    throw error; // Re-throw to be caught by higher-level initializers if necessary
  }
}

// Export a function to get the DB instance. This helps manage the instance lifecycle if needed.
export function getDb() {
  if (!dbInstance) {
    console.log('db-serverless.ts: Initializing new dbInstance in getDb().');
    dbInstance = makeDb();
  }
  return dbInstance;
}

// For direct import and use in API routes, initialize and export 'db'.
// This instance will be created when the module is first imported by a serverless function.
export const db = getDb();

// Self-test and log initialization status
async function verifyInitialConnection() {
  try {
    const currentDb = getDb(); // Ensures db is initialized
    await currentDb.execute(sql`SELECT 1`);
    console.log('db-serverless.ts: Initial database connection verification successful.');
  } catch (error) {
    console.error('db-serverless.ts: ERROR - Initial database connection verification FAILED:', error);
    // Depending on strategy, you might want to prevent app startup or handle this gracefully
  }
}

if (process.env.VERCEL_ENV !== 'build') { // Avoid running this during Vercel build phase
    verifyInitialConnection();
} else {
    console.log('db-serverless.ts: Skipping initial connection verification during build.');
}

console.log('db-serverless.ts: Module loaded.');
