# TravelNexus - Travel Booking Platform

A full-stack travel booking application built with React, Express, PostgreSQL, and Drizzle ORM.

## Vercel Deployment Instructions

### Prerequisites
- A Vercel account
- A Neon PostgreSQL database (or any PostgreSQL provider)
- Git repository with your code

### Step 1: Set up Environment Variables in Vercel
Add the following environment variables in your Vercel project settings:

- `DATABASE_URL`: Your PostgreSQL connection string 
  (Example: `postgresql://neondb_owner:password@hostname/dbname?sslmode=require`)
- `NODE_ENV`: Set to `production`
- Add any other environment variables your application needs

### Step 2: Deploy to Vercel
There are two ways to deploy to Vercel:

#### Option 1: Using Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

#### Option 2: Connect to Git Repository
1. Push your code to GitHub, GitLab, or Bitbucket
2. Import the project in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Verify Database Connectivity
After deployment:
1. Check Vercel logs to confirm database connection
2. Verify data is displaying correctly in the application

### Development
- Run locally: `npm run dev`
- Push schema changes: `npm run db:push`

### Architecture Notes
This application has been adapted for Vercel deployment with:
- Frontend: React with Vite
- Backend: Express API routes via Vercel Serverless Functions
- Database: PostgreSQL with Drizzle ORM

The API routes are configured to work in Vercel's serverless environment while maintaining the functionality of the original Express server.
#   t r a v e l n e x u s  
 