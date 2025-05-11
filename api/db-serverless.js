import { neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';

// Setup Neon serverless driver
neonConfig.fetchConnectionCache = true;

const sql_string = process.env.DATABASE_URL;
const client = neon(sql_string);
export const db = drizzle(client, { schema });

// Export for use in other files
export { sql };
