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
  paymentDetails,
  bookings,
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

// Direct conversations route with user information
router.get("/api/direct/conversations", async (req, res) => {
  try {
    console.log("Direct database access for conversations");
    // Get conversations with user and guest user information
    const allConversations = await db
      .select({
        conversation: conversations,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
        },
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id));
      
    // Format the data for the client
    const formattedConversations = allConversations.map(item => ({
      ...item.conversation,
      user: item.user && item.user.id ? item.user : null
    }));
    
    console.log(`Successfully fetched ${formattedConversations.length} conversations directly from DB`);
    res.json(formattedConversations);
  } catch (error) {
    console.error("Error in direct conversations route:", error);
    res.status(500).json({ error: "Failed to fetch conversations directly" });
  }
});

// Direct messages route
router.get("/api/direct/messages", async (req, res) => {
  try {
    console.log("Direct database access for messages");
    const conversationId = req.query.conversationId;
    
    let allMessages;
    
    if (conversationId) {
      console.log(`Filtering messages for conversation ID: ${conversationId}`);
      allMessages = await db.select().from(messages).where(eq(messages.conversationId, Number(conversationId)));
    } else {
      allMessages = await db.select().from(messages);
    }
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

// Direct payment details route
router.get("/api/direct/payment-details", async (req, res) => {
  try {
    console.log("Direct database access for payment details");
    const allPaymentDetails = await db
      .select({
        payment: paymentDetails,
        booking: {
          id: bookings.id,
          userId: bookings.userId,
          bookingType: bookings.bookingType,
          itemId: bookings.itemId,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          travelDate: bookings.travelDate,
          createdAt: bookings.createdAt,
        }
      })
      .from(paymentDetails)
      .leftJoin(bookings, eq(paymentDetails.bookingId, bookings.id))
      .orderBy(desc(paymentDetails.createdAt));
    
    // Transform the data to the expected format
    const formattedPaymentDetails = allPaymentDetails.map(item => ({
      ...item.payment,
      booking: item.booking
    }));
    
    console.log(`Successfully fetched ${formattedPaymentDetails.length} payment details directly from DB`);
    res.json(formattedPaymentDetails);
  } catch (error) {
    console.error("Error in direct payment details route:", error);
    res.status(500).json({ error: "Failed to fetch payment details directly" });
  }
});

// Direct payment details by booking ID route
router.get("/api/direct/payment-details/:bookingId", async (req, res) => {
  try {
    console.log(`Direct database access for payment details by booking ID: ${req.params.bookingId}`);
    const bookingId = parseInt(req.params.bookingId);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    
    const paymentDetail = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId))
      .limit(1);
    
    if (paymentDetail.length === 0) {
      return res.status(404).json({ error: "Payment details not found for this booking" });
    }
    
    console.log(`Successfully fetched payment details for booking ID: ${bookingId}`);
    res.json(paymentDetail[0]);
  } catch (error) {
    console.error("Error in direct payment details by booking ID route:", error);
    res.status(500).json({ error: "Failed to fetch payment details by booking ID" });
  }
});

// Direct create or update payment details route
router.post("/api/direct/payment-details", async (req, res) => {
  try {
    console.log("Direct database access to create/update payment details");
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }
    
    // Check if payment details already exist for this booking
    const existingPaymentDetail = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId));
    
    let paymentDetail;
    
    if (existingPaymentDetail.length > 0) {
      // Update existing payment details
      console.log(`Updating payment details for booking ID: ${bookingId}`);
      paymentDetail = await db
        .update(paymentDetails)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(paymentDetails.bookingId, bookingId))
        .returning();
    } else {
      // Create new payment details
      console.log(`Creating new payment details for booking ID: ${bookingId}`);
      paymentDetail = await db
        .insert(paymentDetails)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }
    
    console.log(`Successfully saved payment details for booking ID: ${bookingId}`);
    res.status(201).json(paymentDetail[0]);
  } catch (error) {
    console.error("Error in direct create/update payment details route:", error);
    res.status(500).json({ error: "Failed to save payment details" });
  }
});

// Direct create event route
router.post("/api/events", async (req, res) => {
  try {
    console.log("Direct database access to create event");
    const eventData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const createdEvent = await db
      .insert(events)
      .values(eventData)
      .returning();
      
    console.log(`Successfully created new event: ${createdEvent[0].name}`);
    res.status(201).json(createdEvent[0]);
  } catch (error) {
    console.error("Error in direct create event route:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Direct update event route
router.patch("/api/events/:id", async (req, res) => {
  try {
    console.log(`Direct database access to update event with ID: ${req.params.id}`);
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    const eventData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const updatedEvent = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, eventId))
      .returning();
      
    if (updatedEvent.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    console.log(`Successfully updated event with ID: ${eventId}`);
    res.json(updatedEvent[0]);
  } catch (error) {
    console.error("Error in direct update event route:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Direct delete event route
router.delete("/api/events/:id", async (req, res) => {
  try {
    console.log(`Direct database access to delete event with ID: ${req.params.id}`);
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    const deletedEvent = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();
      
    if (deletedEvent.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    console.log(`Successfully deleted event with ID: ${eventId}`);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error in direct delete event route:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;