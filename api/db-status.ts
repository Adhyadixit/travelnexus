import type { Request, Response } from 'express';
import { db } from '../server/db-serverless';
import { sql } from 'drizzle-orm';
import { destinations, hotels, packages, users } from '../shared/schema';
import { count } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Get counts of various tables to check if database is seeded
    const destinationCount = await db.select({ count: count() }).from(destinations);
    const hotelCount = await db.select({ count: count() }).from(hotels);
    const packageCount = await db.select({ count: count() }).from(packages);
    const userCount = await db.select({ count: count() }).from(users);
    
    // Return the status of the database
    return res.status(200).json({
      success: true,
      message: 'Database status check completed',
      counts: {
        destinations: Number(destinationCount[0]?.count || 0),
        hotels: Number(hotelCount[0]?.count || 0),
        packages: Number(packageCount[0]?.count || 0),
        users: Number(userCount[0]?.count || 0)
      },
      isSeeded: (
        (Number(destinationCount[0]?.count) > 0) && 
        (Number(hotelCount[0]?.count) > 0) && 
        (Number(packageCount[0]?.count) > 0) && 
        (Number(userCount[0]?.count) > 0)
      ),
      database_url: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.substring(0, 20)}...` : 
        'Not set'
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
