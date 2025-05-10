// Custom migration script for Vercel deployment
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set environment variable to force migrations
process.env.DRIZZLE_ALLOW_DATA_LOSS = 'true';

console.log('Starting database migration with force flag...');

// Create a temporary drizzle config that allows data loss
const tempConfigPath = path.resolve(process.cwd(), 'drizzle.temp.json');
const config = {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  strict: false,
  verbose: true
};

try {
  // Write temporary config
  fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
  console.log('Created temporary drizzle config with strict mode disabled');
  
  // Run drizzle-kit with the temporary config
  const drizzle = spawn('npx', ['drizzle-kit', 'push', '--config', tempConfigPath], {
    stdio: 'inherit',
    shell: true
  });
  
  drizzle.on('close', (code) => {
    // Clean up temporary config
    try {
      fs.unlinkSync(tempConfigPath);
      console.log('Cleaned up temporary config file');
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
    
    if (code === 0) {
      console.log('Database migration completed successfully');
      process.exit(0);
    } else {
      console.error(`Migration failed with code ${code}`);
      process.exit(1);
    }
  });
} catch (error) {
  console.error('Migration script error:', error);
  process.exit(1);
}
