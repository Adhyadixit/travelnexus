import { db } from './db';
import { hotels } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function generateRandomNumber(min: number, max: number): Promise<number> {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateReviewCounts() {
  try {
    console.log('Starting review count update...');
    
    // Get all hotels
    const allHotels = await db.query.hotels.findMany();
    
    for (const hotel of allHotels) {
      // Generate random number between 100 and 250 for review count
      const reviewCount = await generateRandomNumber(100, 250);
      
      // Generate random rating between 7.5 and 9.8 for user rating (out of 10)
      const userRating = (Math.random() * (9.8 - 7.5) + 7.5).toFixed(1);
      
      // Update the hotel with new review count and user rating
      await db
        .update(hotels)
        .set({
          reviewCount: reviewCount,
          userRating: parseFloat(userRating)
        })
        .where(eq(hotels.id, hotel.id));
      
      console.log(`Updated hotel ${hotel.id} (${hotel.name}) with ${reviewCount} reviews and ${userRating} rating`);
    }
    
    console.log('Review count update completed successfully!');
  } catch (error) {
    console.error('Error updating review counts:', error);
  }
}

// Execute the update function
updateReviewCounts().then(() => {
  console.log('Review count update script completed');
  process.exit(0);
}).catch(error => {
  console.error('Error in review count update script:', error);
  process.exit(1);
});