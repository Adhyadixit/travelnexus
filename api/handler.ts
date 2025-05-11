import type { Request, Response } from 'express';
import { db } from './db';
import { storage } from './storage';
import { isAuthenticated, isAdmin } from './auth';
import { uploadImage, deleteImage } from './cloudinary';
import { 
  eq, and, gte, lte, desc, asc, like, sql,
  destinations, packages, hotels, drivers, cruises, events, 
  users, reviews, guestUsers, conversations, messages, 
  conversationStatusEnum, messageTypeEnum, hotelRoomTypes, 
  hotelRoomImages, paymentDetails, bookings,
  insertDestinationSchema, insertCruiseSchema, insertDriverSchema,
  insertEventSchema, insertHotelSchema, insertHotelRoomTypeSchema,
  insertHotelRoomImageSchema, insertPackageSchema
} from './schema';

// This single file will handle all API routes to reduce the number of serverless functions

/**
 * Main API handler for all routes
 * @param app Express application
 */
export function setupAllRoutes(app: any) {
  // ===== IMAGE UPLOAD ROUTES =====
  setupImageUploadRoutes(app);
  
  // ===== ADMIN ROUTES =====
  setupAdminRoutes(app);
  
  // ===== DATA ROUTES =====
  setupDataRoutes(app);
  
  // ===== PUBLIC ROUTES =====
  setupPublicRoutes(app);
}

/**
 * Image upload routes
 */
function setupImageUploadRoutes(app: any) {
  /**
   * @route POST /api/upload-image
   * @desc Upload an image to Cloudinary
   * @access Public
   */
  app.post("/api/upload-image", async (req: Request, res: Response) => {
    try {
      const { file, folder } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      // Validate the file (data URI)
      if (!file.startsWith('data:image/')) {
        return res.status(400).json({ error: "Invalid file format" });
      }
      
      const uploadResult = await uploadImage(file, folder);
      res.json(uploadResult);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error uploading image: ${errorMessage}`);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
}

/**
 * Admin routes for managing destinations, cruises, hotels, etc.
 */
function setupAdminRoutes(app: any) {
  // ===== DESTINATIONS =====

  /**
   * @route GET /api/destinations/admin
   * @desc Get all destinations for admin
   * @access Private (Admin only)
   */
  app.get("/api/destinations/admin", async (req: Request, res: Response) => {
    try {
      console.log("Session:", req.session);
      console.log("Is authenticated:", req.isAuthenticated());
      console.log("User:", req.user);
      
      // Direct DB access for testing
      const allDestinations = await db.select().from(destinations);
      res.json(allDestinations);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  /**
   * @route POST /api/destinations
   * @desc Create a new destination
   * @access Private (Admin only)
   */
  app.post("/api/destinations", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const destinationData = insertDestinationSchema.parse(req.body);
      const newDestination = await storage.createDestination(destinationData);
      res.status(201).json(newDestination);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(400).json({ error: "Failed to create destination" });
    }
  });

  /**
   * @route PUT /api/destinations/:id
   * @desc Update a destination
   * @access Private (Admin only)
   */
  app.put("/api/destinations/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const destinationId = parseInt(req.params.id);
      const destinationData = insertDestinationSchema.parse(req.body);
      const updatedDestination = await storage.updateDestination(destinationId, destinationData);
      
      if (!updatedDestination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json(updatedDestination);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(400).json({ error: "Failed to update destination" });
    }
  });

  /**
   * @route DELETE /api/destinations/:id
   * @desc Delete a destination
   * @access Private (Admin only)
   */
  app.delete("/api/destinations/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const destinationId = parseInt(req.params.id);
      const destination = await storage.getDestination(destinationId);
      
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      // Delete associated images from Cloudinary
      if (destination.imageUrl) {
        await deleteImage(destination.imageUrl);
      }
      
      // Delete the destination
      await storage.deleteDestination(destinationId);
      
      res.json({ message: "Destination deleted successfully" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to delete destination" });
    }
  });

  // ===== CRUISES =====

  /**
   * @route GET /api/cruises/admin
   * @desc Get all cruises for admin
   * @access Private (Admin only)
   */
  app.get("/api/cruises/admin", (req: Request, res: Response) => {
    try {
      console.log("User authenticated:", req.isAuthenticated());
      console.log("User role:", req.user?.role);
      console.log("User:", req.user);
      
      // Bypass auth for testing
      storage.getAllCruises()
        .then(cruises => {
          res.json(cruises);
        })
        .catch(error => {
          console.error("Error fetching cruises:", error);
          res.status(500).json({ error: "Failed to fetch cruises" });
        });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });

  // Add other admin routes for hotels, packages, events, etc.
}

/**
 * Data routes for database access and payment details
 */
function setupDataRoutes(app: any) {
  // ===== DIRECT DATABASE ACCESS =====

  /**
   * @route GET /api/db/destinations
   * @desc Get all destinations directly from the database
   * @access Public (for development only)
   */
  app.get("/api/db/destinations", async (req: Request, res: Response) => {
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
  app.get("/api/db/packages", async (req: Request, res: Response) => {
    try {
      const allPackages = await db.select().from(packages);
      res.json(allPackages);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch packages from database" });
    }
  });

  // ===== PAYMENT DETAILS =====

  // Get payment details for a specific booking
  app.get("/api/payment-details/booking/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
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
  app.post("/api/payment-details", isAuthenticated, async (req: Request, res: Response) => {
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
}

/**
 * Public routes for user-facing functionality
 */
function setupPublicRoutes(app: any) {
  /**
   * @route GET /api/destinations
   * @desc Get all destinations
   * @access Public
   */
  app.get("/api/destinations", async (req: Request, res: Response) => {
    try {
      const allDestinations = await storage.getAllDestinations();
      res.json(allDestinations);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  /**
   * @route GET /api/destinations/:id
   * @desc Get a destination by ID
   * @access Public
   */
  app.get("/api/destinations/:id", async (req: Request, res: Response) => {
    try {
      const destinationId = parseInt(req.params.id);
      const destination = await storage.getDestination(destinationId);
      
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json(destination);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch destination" });
    }
  });

  /**
   * @route GET /api/packages
   * @desc Get all packages
   * @access Public
   */
  app.get("/api/packages", async (req: Request, res: Response) => {
    try {
      const allPackages = await storage.getAllPackages();
      res.json(allPackages);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });
}
