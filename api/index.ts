import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes.js';

// Import serverless database connection
import '../server/db-serverless.js';

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Setup middleware for CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Setup API routes
let routesRegistered = false;
let routePromise: Promise<any> | null = null;

async function initializeRoutes() {
  if (!routePromise) {
    routePromise = registerRoutes(app);
  }
  return routePromise;
}

// Create an API handler for Vercel
export default async function handler(req: Request, res: Response) {
  try {
    // Initialize routes if not already done
    if (!routesRegistered) {
      await initializeRoutes();
      routesRegistered = true;
    }

    // Process the incoming request
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
