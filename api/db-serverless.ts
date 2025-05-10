import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema'; // Using local path for Vercel compatibility
import { sql } from 'drizzle-orm';

console.log('db-serverless.ts: Module loading...');

neonConfig.fetchConnectionCache = true; // Recommended for serverless environments

const enableDebugLogs = process.env.NODE_ENV !== 'production' && process.env.DEBUG_DB === 'true';

if (enableDebugLogs) {
  console.log('db-serverless.ts: Database debug logging enabled.');
}

let initializingDb = false;
let dbInitialized = false;
let connectionErrors: string[] = [];

function makeDb() {
  console.log('db-serverless.ts: makeDb() called.');
  try {
    console.log(' [DB] Initializing database connection...');
    console.log(` [DB] Environment: ${process.env.NODE_ENV || 'not set'}`);
    console.log(` [DB] Running on Vercel: ${process.env.VERCEL ? 'yes' : 'no'}`);
    
    // Set the flag to indicate we are initializing
    initializingDb = true;

    // Check if DATABASE_URL is properly set
    if (!process.env.DATABASE_URL) {
      console.error(' [DB] DATABASE_URL is not defined!');
      connectionErrors.push('DATABASE_URL is missing');
    } else {
      // Don't log the full URL as it contains credentials
      const dbUrlParts = process.env.DATABASE_URL.split('@');
      const maskedUrl = dbUrlParts.length > 1 
        ? `***:***@${dbUrlParts[dbUrlParts.length - 1]}` 
        : 'Invalid URL format';
      console.log(` [DB] Using database: ${maskedUrl}`);
    }

    // Create a Neon client
    const sql = neon(process.env.DATABASE_URL!);
    console.log(' [DB] Neon SQL client created');

    // Setup Drizzle ORM with Neon serverless driver
    const drizzleInstance = drizzle(sql, { schema });
    console.log(' [DB] Drizzle ORM initialized');

    // Self-test the connection
    (async () => {
      try {
        console.log(' [DB] Testing database connection...');
        // Use raw SQL query to avoid type issues
        const dbInfo = await sql`SELECT NOW() as now`;
        console.log(' [DB] Database connection successful', dbInfo);
        
        // Check if we can access a few key tables
        console.log(' [DB] Testing destinations table...');
        // Use raw SQL query to avoid type issues
        const destinationCount = await sql`SELECT COUNT(*) as count FROM ${schema.destinations}`;
        console.log(` [DB] Destinations table accessible. Count: ${destinationCount[0]?.count || 0}`);

        console.log(' [DB] Testing hotels table...');
        // Use raw SQL query to avoid type issues
        const hotelCount = await sql`SELECT COUNT(*) as count FROM ${schema.hotels}`;
        console.log(` [DB] Hotels table accessible. Count: ${hotelCount[0]?.count || 0}`);
        
        // Mark as initialized
        dbInitialized = true;
        initializingDb = false;
      } catch (error: unknown) {
        console.error(' [DB] Database connection test failed:', error);
        connectionErrors.push(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
        initializingDb = false;
      }
    })();
  } catch (error: unknown) {
    console.error(' [DB] Database initialization failed:', error);
    connectionErrors.push(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    initializingDb = false;
  }
}

// Export helper functions to check connection status
export const getDbStatus = () => {
  return {
    initialized: dbInitialized,
    initializing: initializingDb,
    errors: connectionErrors
  };
};

// Store the database instance
let dbInstance: ReturnType<typeof drizzle>;

// Export a function to get the DB instance. This helps manage the instance lifecycle if needed.
export function getDb() {
  if (!dbInstance) {
    console.log('db-serverless.ts: Initializing new dbInstance in getDb().');
    dbInstance = drizzle(neon(process.env.DATABASE_URL!), { schema });
    // Trigger the makeDb function for additional logging and testing
    makeDb();
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
