// Run-seed script for populating the database
import { seed } from './server/seed.js';

// Set environment variables and run seed
async function main() {
  console.log('Running database seed...');
  try {
    await seed();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main();
