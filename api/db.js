import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema.js';

const sql = process.env.DATABASE_URL;
const client = neon(sql);
export const db = drizzle(client, { schema });
export { sql } from 'drizzle-orm';
