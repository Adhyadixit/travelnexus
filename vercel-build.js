#!/usr/bin/env node

// Custom build script for Vercel deployment
import { execSync } from 'child_process';

console.log('Starting Vercel build process...');

try {
  // Set environment variable to auto-accept migrations
  process.env.DRIZZLE_ACCEPT_DATA_LOSS = 'true';
  
  // Run drizzle-kit push with auto-accept
  console.log('Running database migrations...');
  execSync('npx drizzle-kit push --accept-data-loss', { stdio: 'inherit' });
  
  // Run the build
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Compile TypeScript for serverless functions
  console.log('Compiling TypeScript for serverless functions...');
  execSync('tsc --project tsconfig.vercel.json', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
