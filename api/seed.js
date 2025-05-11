import { storage } from "./storage.js";
import { db } from "./db.js";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
// Import directly from local schema instead of @shared/schema
import {
  destinations, packages, hotels, drivers, cruises, events,
  users, reviews, guestUsers, conversations, messages,
  conversationStatusEnum, messageTypeEnum, hotelRoomTypes,
  hotelRoomImages, paymentDetails, bookings
} from "./schema.js";

// Function to create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, "admin@travelnexus.com")
    });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user with bcrypt hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    const admin = await db.insert(users).values({
      name: "Admin User",
      email: "admin@travelnexus.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log("Admin user created successfully:", admin[0].email);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Function to create destinations
async function createDestinations() {
  try {
    // Check if destinations already exist
    const existingDestinations = await db.query.destinations.findMany();
    if (existingDestinations.length > 0) {
      console.log("Destinations already exist, skipping seed");
      return;
    }

    const destinationsData = [
      {
        name: "Paris",
        description: "The City of Light, known for its art, fashion, and architecture.",
        image: "https://res.cloudinary.com/dtr76y0ia/image/upload/v1697888136/travel-nexus/destinations/paris.jpg",
        location: "France"
      },
      {
        name: "Tokyo",
        description: "A vibrant metropolis that blends ultramodern and traditional.",
        image: "https://res.cloudinary.com/dtr76y0ia/image/upload/v1697888136/travel-nexus/destinations/tokyo.jpg",
        location: "Japan"
      },
      {
        name: "New York",
        description: "The city that never sleeps, offering endless entertainment and culture.",
        image: "https://res.cloudinary.com/dtr76y0ia/image/upload/v1697888136/travel-nexus/destinations/newyork.jpg",
        location: "USA"
      },
      {
        name: "Bali",
        description: "A tropical paradise with beautiful beaches and vibrant culture.",
        image: "https://res.cloudinary.com/dtr76y0ia/image/upload/v1697888136/travel-nexus/destinations/bali.jpg",
        location: "Indonesia"
      },
      {
        name: "Rome",
        description: "The Eternal City, home to ancient ruins and exquisite cuisine.",
        image: "https://res.cloudinary.com/dtr76y0ia/image/upload/v1697888136/travel-nexus/destinations/rome.jpg",
        location: "Italy"
      }
    ];

    for (const d of destinationsData) {
      await db.insert(destinations).values({
        name: d.name,
        description: d.description,
        image: d.image,
        location: d.location,
        reviewCount: 0,
        averageRating: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("Destinations created successfully");
  } catch (error) {
    console.error("Error creating destinations:", error);
  }
}

// Main seed function
async function seed() {
  try {
    console.log("Starting database seed...");
    
    // Create admin user
    await createAdminUser();
    
    // Create destinations
    await createDestinations();
    
    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Export the seed function
export default seed;
