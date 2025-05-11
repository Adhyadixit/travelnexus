import express from 'express';
// Import the consolidated handler instead of individual routes
import { setupAllRoutes } from './handler.js';

// Import serverless database connection
import './db-serverless.js';

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

// Initialize routes
function initializeRoutes() {
  setupAllRoutes(app);
}

// Initialize the routes
initializeRoutes();

// Create an API handler for Vercel
export default function handler(req, res) {
  if (!req.url) {
    req.url = '/';
  }
  
  return new Promise((resolve) => {
    app(req, res, (result) => {
      resolve(result);
    });
  });
}
