import { Router, Request, Response } from "express";
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
  bookings
} from "../schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../auth";

const router = Router();

// ===== DIRECT DATABASE ACCESS =====

// Direct database access routes that COMPLETELY bypass auth
// These are for development and testing purposes only

/**
 * @route GET /api/db/destinations
 * @desc Get all destinations directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/destinations", async (req, res) => {
  try {
    const allDestinations = await db.select().from(destinations);
    res.json(allDestinations);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch destinations from database" });
  }
});

/**
 * @route GET /api/db/packages
 * @desc Get all packages directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/packages", async (req, res) => {
  try {
    const allPackages = await db.select().from(packages);
    res.json(allPackages);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch packages from database" });
  }
});

/**
 * @route GET /api/db/hotels
 * @desc Get all hotels directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/hotels", async (req, res) => {
  try {
    const allHotels = await db.select().from(hotels);
    res.json(allHotels);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch hotels from database" });
  }
});

/**
 * @route GET /api/db/drivers
 * @desc Get all drivers directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/drivers", async (req, res) => {
  try {
    const allDrivers = await db.select().from(drivers);
    res.json(allDrivers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch drivers from database" });
  }
});

/**
 * @route GET /api/db/cruises
 * @desc Get all cruises directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/cruises", async (req, res) => {
  try {
    const allCruises = await db.select().from(cruises);
    res.json(allCruises);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch cruises from database" });
  }
});

/**
 * @route GET /api/db/events
 * @desc Get all events directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/events", async (req, res) => {
  try {
    const allEvents = await db.select().from(events);
    res.json(allEvents);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch events from database" });
  }
});

/**
 * @route GET /api/db/users
 * @desc Get all users directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    // Remove sensitive data
    const sanitizedUsers = allUsers.map(user => {
      const { password, ...userData } = user;
      return userData;
    });
    res.json(sanitizedUsers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch users from database" });
  }
});

/**
 * @route GET /api/db/reviews
 * @desc Get all reviews directly from the database
 * @access Public (for development only)
 */
router.get("/api/db/reviews", async (req, res) => {
  try {
    const allReviews = await db.select().from(reviews);
    res.json(allReviews);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch reviews from database" });
  }
});

// ===== PAYMENT DETAILS =====

// Get payment details for a specific booking
router.get("/api/payment-details/booking/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    
    const paymentDetail = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId))
      .limit(1);
    
    if (!paymentDetail || paymentDetail.length === 0) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    
    // Check if the user is authorized to view this payment detail
    // @ts-ignore - req.user is added by passport
    const userId = req.user?.id;
    
    // Get the booking to check if it belongs to the user
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if the user is the owner of the booking or an admin
    // @ts-ignore - req.user is added by passport
    if (booking[0].userId !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    res.json(paymentDetail[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching payment details: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// Create payment details for a booking
router.post("/api/payment-details", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bookingId, cardNumber, cardHolderName, expiryDate, cvv, address, city, state, zipCode, country } = req.body;
    
    if (!bookingId || !cardNumber || !cardHolderName || !expiryDate || !address || !city || !state || !zipCode) {
      return res.status(400).json({ error: "Missing required payment details" });
    }
    
    // Validate booking exists and belongs to the user
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if the user is the owner of the booking
    // @ts-ignore - req.user is added by passport
    const userId = req.user?.id;
    if (booking[0].userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Check if payment details already exist for this booking
    const existingPayment = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId))
      .limit(1);
    
    if (existingPayment && existingPayment.length > 0) {
      return res.status(400).json({ error: "Payment details already exist for this booking" });
    }
    
    // Mask the card number (store only last 4 digits)
    const maskedCardNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
    
    // Create payment details using SQL query to bypass TypeScript type issues
    const newPaymentDetails = await db.execute(sql`
      INSERT INTO payment_details (
        booking_id, card_name, card_number, card_expiry, card_cvc,
        address, city, state, zip_code, country, payment_processor, amount,
        created_at, updated_at
      ) VALUES (
        ${bookingId}, ${cardHolderName}, ${maskedCardNumber}, ${expiryDate}, '***',
        ${address || ''}, ${city || ''}, ${state || ''}, ${zipCode || ''}, ${country || 'USA'},
        'manual', 0, NOW(), NOW()
      ) RETURNING *
    `);
    
    res.status(201).json(newPaymentDetails[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error creating payment details: ${errorMessage}`);
    res.status(500).json({ error: "Failed to create payment details" });
  }
});

export default router;
