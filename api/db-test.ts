import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    // Get environment information
    const envInfo = {
      node_env: process.env.NODE_ENV || 'not set',
      vercel: process.env.VERCEL === '1' ? 'true' : 'false',
      has_db_url: process.env.DATABASE_URL ? 'true' : 'false',
      db_url_prefix: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 15) + '...' : 
        'not set'
    };

    // Return basic information without trying to connect to the database
    return res.status(200).json({
      success: true,
      message: 'Environment information retrieved',
      serverTime: new Date().toISOString(),
      environment: envInfo
    });
  } catch (error) {
    console.error('Error in db-test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving environment information',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
