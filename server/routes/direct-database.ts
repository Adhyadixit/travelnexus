import { Router } from "express";
import { db } from "../db";
import {
  destinations,
  packages,
  hotels,
  drivers,
  cruises,
  events,
  users,
  reviews,
  conversations,
  messages,
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

const router = Router();

// Direct database access routes that COMPLETELY bypass auth
// These routes are only for admin purposes and should be secured in production

// Direct destinations route
router.get("/api/direct/destinations", async (req, res) => {
  try {
    console.log("Direct database access for destinations");
    const allDestinations = await db.select().from(destinations);
    console.log(`Successfully fetched ${allDestinations.length} destinations directly from DB`);
    res.json(allDestinations);
  } catch (error) {
    console.error("Error in direct destinations route:", error);
    res.status(500).json({ error: "Failed to fetch destinations directly" });
  }
});

// Direct cruises route
router.get("/api/direct/cruises", async (req, res) => {
  try {
    console.log("Direct database access for cruises");
    const allCruises = await db.select().from(cruises);
    console.log(`Successfully fetched ${allCruises.length} cruises directly from DB`);
    res.json(allCruises);
  } catch (error) {
    console.error("Error in direct cruises route:", error);
    res.status(500).json({ error: "Failed to fetch cruises directly" });
  }
});

// Direct drivers route
router.get("/api/direct/drivers", async (req, res) => {
  try {
    console.log("Direct database access for drivers");
    const allDrivers = await db.select().from(drivers);
    console.log(`Successfully fetched ${allDrivers.length} drivers directly from DB`);
    res.json(allDrivers);
  } catch (error) {
    console.error("Error in direct drivers route:", error);
    res.status(500).json({ error: "Failed to fetch drivers directly" });
  }
});

// Direct hotels route
router.get("/api/direct/hotels", async (req, res) => {
  try {
    console.log("Direct database access for hotels");
    const allHotels = await db.select().from(hotels);
    console.log(`Successfully fetched ${allHotels.length} hotels directly from DB`);
    res.json(allHotels);
  } catch (error) {
    console.error("Error in direct hotels route:", error);
    res.status(500).json({ error: "Failed to fetch hotels directly" });
  }
});

// Direct packages route
router.get("/api/direct/packages", async (req, res) => {
  try {
    console.log("Direct database access for packages");
    const allPackages = await db.select().from(packages);
    console.log(`Successfully fetched ${allPackages.length} packages directly from DB`);
    res.json(allPackages);
  } catch (error) {
    console.error("Error in direct packages route:", error);
    res.status(500).json({ error: "Failed to fetch packages directly" });
  }
});

// Direct events route
router.get("/api/direct/events", async (req, res) => {
  try {
    console.log("Direct database access for events");
    const allEvents = await db.select().from(events);
    console.log(`Successfully fetched ${allEvents.length} events directly from DB`);
    res.json(allEvents);
  } catch (error) {
    console.error("Error in direct events route:", error);
    res.status(500).json({ error: "Failed to fetch events directly" });
  }
});

// Direct conversations route
router.get("/api/direct/conversations", async (req, res) => {
  try {
    console.log("Direct database access for conversations");
    const allConversations = await db.select().from(conversations);
    console.log(`Successfully fetched ${allConversations.length} conversations directly from DB`);
    res.json(allConversations);
  } catch (error) {
    console.error("Error in direct conversations route:", error);
    res.status(500).json({ error: "Failed to fetch conversations directly" });
  }
});

// Direct messages route
router.get("/api/direct/messages", async (req, res) => {
  try {
    console.log("Direct database access for messages");
    const allMessages = await db.select().from(messages);
    console.log(`Successfully fetched ${allMessages.length} messages directly from DB`);
    res.json(allMessages);
  } catch (error) {
    console.error("Error in direct messages route:", error);
    res.status(500).json({ error: "Failed to fetch messages directly" });
  }
});

// Direct reviews route with user information
router.get("/api/direct/reviews", async (req, res) => {
  try {
    console.log("Direct database access for reviews with user data");
    const allReviews = await db.select({
      review: reviews,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
      }
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt));
    
    // Transform the data to the expected format
    const formattedReviews = allReviews.map(item => ({
      ...item.review,
      user: item.user
    }));
    
    console.log(`Successfully fetched ${formattedReviews.length} reviews directly from DB`);
    res.json(formattedReviews);
  } catch (error) {
    console.error("Error in direct reviews route:", error);
    res.status(500).json({ error: "Failed to fetch reviews directly" });
  }
});

export default router;