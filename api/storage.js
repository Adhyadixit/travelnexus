import { eq, and, gte, lte, desc, asc, like, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import {
  destinations, packages, hotels, drivers, cruises, events,
  users, reviews, guestUsers, conversations, messages,
  hotelRoomTypes, hotelRoomImages, paymentDetails, bookings
} from "./schema.js";

class Storage {
  // === User Management ===
  async getUserByEmail(email) {
    return await db.query.users.findFirst({
      where: eq(users.email, email)
    });
  }

  async createUser({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }

  // === Destination Management ===
  async getAllDestinations() {
    return await db.query.destinations.findMany({
      orderBy: [asc(destinations.name)]
    });
  }
  
  async getDestinationById(id) {
    return await db.query.destinations.findFirst({
      where: eq(destinations.id, id)
    });
  }
  
  async createDestination(data) {
    const result = await db.insert(destinations).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateDestination(id, data) {
    const result = await db.update(destinations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(destinations.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteDestination(id) {
    const result = await db.delete(destinations)
      .where(eq(destinations.id, id))
      .returning();
    
    return result[0];
  }

  // === Package Management ===
  async getAllPackages() {
    return await db.query.packages.findMany({
      with: {
        destination: true
      },
      orderBy: [asc(packages.name)]
    });
  }
  
  async getPackageById(id) {
    return await db.query.packages.findFirst({
      where: eq(packages.id, id),
      with: {
        destination: true
      }
    });
  }
  
  async createPackage(data) {
    const result = await db.insert(packages).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updatePackage(id, data) {
    const result = await db.update(packages)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(packages.id, id))
      .returning();
    
    return result[0];
  }
  
  async deletePackage(id) {
    const result = await db.delete(packages)
      .where(eq(packages.id, id))
      .returning();
    
    return result[0];
  }

  // === Hotel Management ===
  async getAllHotels() {
    return await db.query.hotels.findMany({
      with: {
        destination: true
      },
      orderBy: [asc(hotels.name)]
    });
  }
  
  async getHotelById(id) {
    return await db.query.hotels.findFirst({
      where: eq(hotels.id, id),
      with: {
        destination: true
      }
    });
  }
  
  async createHotel(data) {
    const result = await db.insert(hotels).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateHotel(id, data) {
    const result = await db.update(hotels)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(hotels.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteHotel(id) {
    const result = await db.delete(hotels)
      .where(eq(hotels.id, id))
      .returning();
    
    return result[0];
  }

  // === Driver Management ===
  async getAllDrivers() {
    return await db.query.drivers.findMany({
      with: {
        destination: true
      },
      orderBy: [asc(drivers.name)]
    });
  }
  
  async getDriverById(id) {
    return await db.query.drivers.findFirst({
      where: eq(drivers.id, id),
      with: {
        destination: true
      }
    });
  }
  
  async createDriver(data) {
    const result = await db.insert(drivers).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateDriver(id, data) {
    const result = await db.update(drivers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(drivers.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteDriver(id) {
    const result = await db.delete(drivers)
      .where(eq(drivers.id, id))
      .returning();
    
    return result[0];
  }

  // === Cruise Management ===
  async getAllCruises() {
    return await db.query.cruises.findMany({
      with: {
        destination: true
      },
      orderBy: [asc(cruises.name)]
    });
  }
  
  async getCruiseById(id) {
    return await db.query.cruises.findFirst({
      where: eq(cruises.id, id),
      with: {
        destination: true
      }
    });
  }
  
  async createCruise(data) {
    const result = await db.insert(cruises).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateCruise(id, data) {
    const result = await db.update(cruises)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(cruises.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteCruise(id) {
    const result = await db.delete(cruises)
      .where(eq(cruises.id, id))
      .returning();
    
    return result[0];
  }

  // === Event Management ===
  async getAllEvents() {
    return await db.query.events.findMany({
      with: {
        destination: true
      },
      orderBy: [asc(events.name)]
    });
  }
  
  async getEventById(id) {
    return await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        destination: true
      }
    });
  }
  
  async createEvent(data) {
    const result = await db.insert(events).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateEvent(id, data) {
    const result = await db.update(events)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteEvent(id) {
    const result = await db.delete(events)
      .where(eq(events.id, id))
      .returning();
    
    return result[0];
  }

  // === Review Management ===
  async getReviewsForEntity(entityId, entityType) {
    return await db.query.reviews.findMany({
      where: and(
        eq(reviews.entityId, entityId),
        eq(reviews.entityType, entityType)
      ),
      with: {
        user: true
      },
      orderBy: [desc(reviews.createdAt)]
    });
  }
  
  async createReview(data) {
    const result = await db.insert(reviews).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Update entity's review count and average rating
    await this.updateEntityReviewStats(data.entityId, data.entityType);
    
    return result[0];
  }
  
  async updateEntityReviewStats(entityId, entityType) {
    // Get all reviews for this entity
    const entityReviews = await db.query.reviews.findMany({
      where: and(
        eq(reviews.entityId, entityId),
        eq(reviews.entityType, entityType)
      )
    });
    
    const count = entityReviews.length;
    const total = entityReviews.reduce((sum, review) => sum + review.rating, 0);
    const average = count > 0 ? total / count : 0;
    
    // Update the appropriate entity based on type
    let result;
    
    switch (entityType) {
      case 'destination':
        result = await db.update(destinations)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(destinations.id, entityId));
        break;
      case 'package':
        result = await db.update(packages)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(packages.id, entityId));
        break;
      case 'hotel':
        result = await db.update(hotels)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(hotels.id, entityId));
        break;
      case 'cruise':
        result = await db.update(cruises)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(cruises.id, entityId));
        break;
      case 'driver':
        result = await db.update(drivers)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(drivers.id, entityId));
        break;
      case 'event':
        result = await db.update(events)
          .set({
            reviewCount: count,
            averageRating: average,
            updatedAt: new Date()
          })
          .where(eq(events.id, entityId));
        break;
    }
    
    return result;
  }
}

export const storage = new Storage();
