import type { Request, Response } from 'express';
import { db, testConnection } from '../server/db-serverless';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Test database connection with the test function
    const connectionTest = await testConnection();
    
    // Also try a time query to verify full functionality
    let timeResult = null;
    let time = new Date().toISOString();
    
    if (connectionTest.success) {
      try {
        const result = await db.execute(sql`SELECT NOW() as time`);
        timeResult = result;
        time = result.rows?.[0]?.time || time;
      } catch (timeError) {
        console.error('Time query failed:', timeError);
      }
    }
    
    // Return database connection info and time
    return res.status(connectionTest.success ? 200 : 500).json({
      success: connectionTest.success,
      message: connectionTest.success ? 'Database connection successful' : 'Database connection failed',
      connectionTest,
      timeResult,
      time,
      database_url: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.substring(0, 25)}...` : 
        'Not set',
      node_env: process.env.NODE_ENV,
      vercel: process.env.VERCEL === '1' ? 'true' : 'false'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
