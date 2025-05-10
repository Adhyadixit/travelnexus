import type { Request, Response } from 'express';
import { db } from '../server/db-serverless';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Try a simple database connection test
    let dbConnected = false;
    let dbError: string | null = null;
    
    try {
      // Simple query to check if database is accessible
      const result = await db.execute(sql`SELECT 1 as connected`);
      dbConnected = !!result;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
      console.error('Database connection error:', dbError);
    }
    
    // Return the status of the database connection
    return res.status(dbConnected ? 200 : 500).json({
      success: dbConnected,
      message: dbConnected ? 'Database connection successful' : 'Database connection failed',
      connectionStatus: dbConnected ? 'connected' : 'disconnected',
      error: dbError,
      database_url: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.substring(0, 15)}...` : 
        'not set',
      environment: {
        node_env: process.env.NODE_ENV || 'not set',
        vercel: process.env.VERCEL === '1' ? 'true' : 'false'
      }
    });
  } catch (error) {
    console.error('Database status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database status check failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
