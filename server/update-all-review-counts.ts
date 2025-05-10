import { db } from './db';
import { hotels, cruises, packages, events } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function generateRandomNumber(min: number, max: number): Promise<number> {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateAllReviewCounts() {
  try {
    console.log('Starting review count update for all listings...');
    
    // Update hotels (already done, but included for completeness)
    const allHotels = await db.query.hotels.findMany();
    for (const hotel of allHotels) {
      const reviewCount = await generateRandomNumber(100, 250);
      const userRating = (Math.random() * (9.8 - 7.5) + 7.5).toFixed(1);
      
      await db
        .update(hotels)
        .set({
          reviewCount: reviewCount,
          userRating: parseFloat(userRating)
        })
        .where(eq(hotels.id, hotel.id));
      
      console.log(`Updated hotel ${hotel.id} (${hotel.name}) with ${reviewCount} reviews and ${userRating} rating`);
    }
    
    // Update cruises
    const allCruises = await db.query.cruises.findMany();
    for (const cruise of allCruises) {
      const reviewCount = await generateRandomNumber(100, 250);
      const userRating = (Math.random() * (9.8 - 7.5) + 7.5).toFixed(1);
      
      await db
        .update(cruises)
        .set({
          reviewCount: reviewCount,
          userRating: parseFloat(userRating)
        })
        .where(eq(cruises.id, cruise.id));
      
      console.log(`Updated cruise ${cruise.id} (${cruise.name}) with ${reviewCount} reviews and ${userRating} rating`);
    }
    
    // Update packages
    const allPackages = await db.query.packages.findMany();
    for (const pkg of allPackages) {
      const reviewCount = await generateRandomNumber(100, 250);
      const userRating = (Math.random() * (9.8 - 7.5) + 7.5).toFixed(1);
      
      await db
        .update(packages)
        .set({
          reviewCount: reviewCount,
          userRating: parseFloat(userRating)
        })
        .where(eq(packages.id, pkg.id));
      
      console.log(`Updated package ${pkg.id} (${pkg.name}) with ${reviewCount} reviews and ${userRating} rating`);
    }
    
    // Update events
    const allEvents = await db.query.events.findMany();
    for (const event of allEvents) {
      const reviewCount = await generateRandomNumber(100, 250);
      const userRating = (Math.random() * (9.8 - 7.5) + 7.5).toFixed(1);
      
      await db
        .update(events)
        .set({
          reviewCount: reviewCount,
          userRating: parseFloat(userRating)
        })
        .where(eq(events.id, event.id));
      
      console.log(`Updated event ${event.id} (${event.name}) with ${reviewCount} reviews and ${userRating} rating`);
    }
    
    console.log('Review count update for all listings completed successfully!');
  } catch (error) {
    console.error('Error updating review counts:', error);
  }
}

// Execute the update function
updateAllReviewCounts().then(() => {
  console.log('All review count updates completed');
  process.exit(0);
}).catch(error => {
  console.error('Error in review count update script:', error);
  process.exit(1);
});