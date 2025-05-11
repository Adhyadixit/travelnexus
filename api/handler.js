import express from 'express';
import { storage } from './storage.js';
import { isAuthenticated, isAdmin } from './auth.js';
import { uploadImage, deleteImage } from './cloudinary.js';
import { eq, and, gte, lte, desc, asc, like, sql } from 'drizzle-orm';
import {
  destinations, packages, hotels, drivers, cruises, events,
  users, reviews, guestUsers, conversations, messages,
  conversationStatusEnum, messageTypeEnum, hotelRoomTypes,
  hotelRoomImages, paymentDetails, bookings,
  insertDestinationSchema, insertCruiseSchema, insertDriverSchema,
  insertEventSchema, insertHotelSchema, insertHotelRoomTypeSchema,
  insertHotelRoomImageSchema, insertPackageSchema
} from './schema.js';
import { db } from './db.js';

// ===== SETUP ALL ROUTES =====
export function setupAllRoutes(app) {
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
 * Image upload routes for Cloudinary
 */
function setupImageUploadRoutes(app) {
  /**
   * @route POST /api/upload/image
   * @desc Upload an image to Cloudinary
   * @access Private (Admin)
   */
  app.post("/api/upload/image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { image, folder } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }
      
      const uploadResult = await uploadImage(image, folder);
      res.json(uploadResult);
    } catch (error) {
      console.error(`Error uploading image: ${error.message}`);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  /**
   * @route DELETE /api/delete/image
   * @desc Delete an image from Cloudinary
   * @access Private (Admin)
   */
  app.delete("/api/delete/image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { publicId } = req.body;
      
      if (!publicId) {
        return res.status(400).json({ error: "No publicId provided" });
      }
      
      const result = await deleteImage(publicId);
      res.json(result);
    } catch (error) {
      console.error(`Error deleting image: ${error.message}`);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
}

/**
 * Admin routes for managing site content
 */
function setupAdminRoutes(app) {
  /**
   * @route POST /api/admin/destinations
   * @desc Create a new destination
   * @access Private (Admin)
   */
  app.post("/api/admin/destinations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertDestinationSchema.parse(req.body);
      const newDestination = await storage.createDestination(validatedData);
      res.status(201).json(newDestination);
    } catch (error) {
      console.error(`Error creating destination: ${error.message}`);
      res.status(500).json({ error: "Failed to create destination" });
    }
  });

  /**
   * @route PUT /api/admin/destinations/:id
   * @desc Update a destination
   * @access Private (Admin)
   */
  app.put("/api/admin/destinations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDestinationSchema.parse(req.body);
      const updatedDestination = await storage.updateDestination(parseInt(id), validatedData);
      
      if (!updatedDestination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json(updatedDestination);
    } catch (error) {
      console.error(`Error updating destination: ${error.message}`);
      res.status(500).json({ error: "Failed to update destination" });
    }
  });

  /**
   * @route DELETE /api/admin/destinations/:id
   * @desc Delete a destination
   * @access Private (Admin)
   */
  app.delete("/api/admin/destinations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.deleteDestination(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json({ message: "Destination deleted successfully" });
    } catch (error) {
      console.error(`Error deleting destination: ${error.message}`);
      res.status(500).json({ error: "Failed to delete destination" });
    }
  });
  
  // Similar routes for other entities (packages, hotels, etc.)
  // ...

  /**
   * @route POST /api/admin/packages
   * @desc Create a new package
   * @access Private (Admin)
   */
  app.post("/api/admin/packages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPackageSchema.parse(req.body);
      const newPackage = await storage.createPackage(validatedData);
      res.status(201).json(newPackage);
    } catch (error) {
      console.error(`Error creating package: ${error.message}`);
      res.status(500).json({ error: "Failed to create package" });
    }
  });

  /**
   * @route PUT /api/admin/packages/:id
   * @desc Update a package
   * @access Private (Admin)
   */
  app.put("/api/admin/packages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPackageSchema.parse(req.body);
      const updatedPackage = await storage.updatePackage(parseInt(id), validatedData);
      
      if (!updatedPackage) {
        return res.status(404).json({ error: "Package not found" });
      }
      
      res.json(updatedPackage);
    } catch (error) {
      console.error(`Error updating package: ${error.message}`);
      res.status(500).json({ error: "Failed to update package" });
    }
  });
  
  // Add more admin routes as needed
}

/**
 * Data routes for admin operations on data entities
 */
function setupDataRoutes(app) {
  /**
   * @route POST /api/payment-details
   * @desc Create payment details for a booking
   * @access Private
   */
  app.post("/api/payment-details", isAuthenticated, async (req, res) => {
    try {
      const { 
        bookingId, cardHolderName, cardNumber, expiryDate, 
        address, city, state, zipCode, country 
      } = req.body;
      
      if (!bookingId || !cardHolderName || !cardNumber || !expiryDate) {
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Check if payment details already exist for this booking
      const existingPaymentDetails = await db.query.paymentDetails.findFirst({
        where: eq(paymentDetails.bookingId, bookingId)
      });
      
      if (existingPaymentDetails) {
        return res.status(400).json({ error: "Payment details already exist for this booking" });
      }
      
      // Mask the card number (store only last 4 digits)
      const maskedCardNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
      
      // Create payment details using SQL query to bypass TypeScript type issues
      const newPaymentDetailsResult = await db.execute(sql`
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
      // Drizzle's db.execute(sql) returns an object with a 'rows' property (for pg), fallback to [0] if needed
      const inserted = (newPaymentDetailsResult.rows && newPaymentDetailsResult.rows[0]) || newPaymentDetailsResult[0] || newPaymentDetailsResult;
      res.status(201).json(inserted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error creating payment details: ${errorMessage}`);
      res.status(500).json({ error: "Failed to create payment details" });
    }
  });
}

/**
 * Public routes for user-facing functionality
 */
function setupPublicRoutes(app) {
  /**
   * @route GET /api/destinations
   * @desc Get all destinations
   * @access Public
   */
  app.get("/api/destinations", async (req, res) => {
    try {
      const allDestinations = await storage.getAllDestinations();
      res.json(allDestinations);
    } catch (error) {
      console.error(`Error fetching destinations: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  /**
   * @route GET /api/destinations/:id
   * @desc Get a destination by ID
   * @access Public
   */
  app.get("/api/destinations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const destination = await storage.getDestinationById(parseInt(id));
      
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json(destination);
    } catch (error) {
      console.error(`Error fetching destination: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch destination" });
    }
  });

  /**
   * @route GET /api/packages
   * @desc Get all packages
   * @access Public
   */
  app.get("/api/packages", async (req, res) => {
    try {
      const allPackages = await storage.getAllPackages();
      res.json(allPackages);
    } catch (error) {
      console.error(`Error fetching packages: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  /**
   * @route GET /api/hotels
   * @desc Get all hotels
   * @access Public
   */
  app.get("/api/hotels", async (req, res) => {
    try {
      const allHotels = await storage.getAllHotels();
      res.json(allHotels);
    } catch (error) {
      console.error(`Error fetching hotels: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch hotels" });
    }
  });

  /**
   * @route GET /api/cruises
   * @desc Get all cruises
   * @access Public
   */
  app.get("/api/cruises", async (req, res) => {
    try {
      const allCruises = await storage.getAllCruises();
      res.json(allCruises);
    } catch (error) {
      console.error(`Error fetching cruises: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });

  /**
   * @route GET /api/drivers
   * @desc Get all drivers
   * @access Public
   */
  app.get("/api/drivers", async (req, res) => {
    try {
      const allDrivers = await storage.getAllDrivers();
      res.json(allDrivers);
    } catch (error) {
      console.error(`Error fetching drivers: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  /**
   * @route GET /api/events
   * @desc Get all events
   * @access Public
   */
  app.get("/api/events", async (req, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      res.json(allEvents);
    } catch (error) {
      console.error(`Error fetching events: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  /**
   * @route GET /api/user
   * @desc Get the current logged-in user
   * @access Private
   */
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      // req.user is set by passport
      const user = req.user;
      
      // Don't send password or sensitive data to client
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(`Error fetching user: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  /**
   * @route POST /api/guest-conversations
   * @desc Create a new guest conversation
   * @access Public
   */
  app.post("/api/guest-conversations", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Create guest user
      const newGuestUser = await db.insert(guestUsers).values({
        name,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      const guestUserId = newGuestUser[0].id;
      
      // Create conversation
      const newConversation = await db.insert(conversations).values({
        guestUserId,
        status: conversationStatusEnum.enumValues[0], // Open
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      const conversationId = newConversation[0].id;
      
      // Create message
      await db.insert(messages).values({
        conversationId,
        content: message,
        type: messageTypeEnum.enumValues[0], // Customer
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({ success: true, conversationId });
    } catch (error) {
      console.error(`Error creating guest conversation: ${error.message}`);
      res.status(500).json({ error: "Failed to create guest conversation" });
    }
  });

  /**
   * @route GET /api/guest-conversations/:conversationId
   * @desc Get a guest conversation by ID
   * @access Public (with email verification)
   */
  app.get("/api/guest-conversations/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Get conversation with guest user
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: {
          guestUser: true,
          messages: {
            orderBy: asc(messages.createdAt)
          }
        }
      });
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Verify email matches
      if (conversation.guestUser.email !== email) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error(`Error fetching conversation: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  /**
   * @route POST /api/guest-conversations/:conversationId/messages
   * @desc Add a message to a guest conversation
   * @access Public (with email verification)
   */
  app.post("/api/guest-conversations/:conversationId/messages", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { email, message } = req.body;
      
      if (!email || !message) {
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Get conversation with guest user
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: {
          guestUser: true
        }
      });
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Verify email matches
      if (conversation.guestUser.email !== email) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Create message
      const newMessage = await db.insert(messages).values({
        conversationId,
        content: message,
        type: messageTypeEnum.enumValues[0], // Customer
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Update conversation
      await db.update(conversations)
        .set({ 
          status: conversationStatusEnum.enumValues[0], // Open
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, conversationId));
      
      res.status(201).json(newMessage[0]);
    } catch (error) {
      console.error(`Error adding message: ${error.message}`);
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  /**
   * @route POST /api/register
   * @desc Register a new user
   * @access Public
   */
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Required fields missing" });
      }
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create new user
      const newUser = await storage.createUser({ name, email, password });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error(`Error registering user: ${error.message}`);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  /**
   * @route POST /api/login
   * @desc Authenticate a user and return a JWT token
   * @access Public
   */
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  /**
   * @route POST /api/logout
   * @desc Logout a user
   * @access Private
   */
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}
