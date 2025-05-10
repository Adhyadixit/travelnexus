import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { db } from "./db";
import { seed } from "./seed";
import { uploadImage } from "./cloudinary";
import imageUploadRoutes from "./routes/image-upload";
import adminDestinationsRoutes from "./routes/admin-destinations";
import adminCruisesRoutes from "./routes/admin-cruises";
import adminDriversRoutes from "./routes/admin-drivers";
import adminEventsRoutes from "./routes/admin-events";
import adminHotelsRoutes from "./routes/admin-hotels";
import adminPackagesRoutes from "./routes/admin-packages";
import directDatabaseRoutes from "./routes/direct-database";
import paymentDetailsRoutes from "./routes/payment-details";
import {
  eq, and, gte, lte, desc, asc, like,
} from "drizzle-orm";
import {
  bookings, bookingTypeEnum,
  destinations, packages, hotels, drivers, cruises, events, users, reviews,
  guestUsers, conversations, messages, conversationStatusEnum, messageTypeEnum,
  hotelRoomTypes, hotelRoomImages, insertDestinationSchema,
  type Conversation, type Message, type InsertMessage
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Set up Socket.IO server for real-time chat features
  const io = new SocketIOServer(httpServer, {
    path: '/ws',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Map to track typing status by conversation ID and user IDs
  const typingUsers = new Map();
  
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('A client connected');
    
    // Join a conversation room
    socket.on('join-conversation', (conversationId) => {
      console.log(`Client joining conversation: ${conversationId}`);
      socket.join(`conversation-${conversationId}`);
    });
    
    // Leave a conversation room
    socket.on('leave-conversation', (conversationId) => {
      console.log(`Client leaving conversation: ${conversationId}`);
      socket.leave(`conversation-${conversationId}`);
    });
    
    // Handle typing indicators
    socket.on('typing-start', ({ conversationId, userId, userType }) => {
      const key = `${conversationId}-${userId}-${userType}`;
      typingUsers.set(key, true);
      
      // Notify others in the conversation that this user is typing
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        conversationId,
        userId,
        userType,
        isTyping: true
      });
    });
    
    // Handle typing stopped
    socket.on('typing-stop', ({ conversationId, userId, userType }) => {
      const key = `${conversationId}-${userId}-${userType}`;
      typingUsers.delete(key);
      
      // Notify others that this user stopped typing
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        conversationId,
        userId,
        userType,
        isTyping: false
      });
    });
    
    // Handle new message notifications
    socket.on('new-message', (message) => {
      // Broadcast to all clients in the conversation room
      io.to(`conversation-${message.conversationId}`).emit('message-received', message);
      
      // Clear typing indicator for this user
      const key = `${message.conversationId}-${message.senderId}-${message.senderType}`;
      typingUsers.delete(key);
      
      // Notify that user stopped typing
      socket.to(`conversation-${message.conversationId}`).emit('user-typing', {
        conversationId: message.conversationId,
        userId: message.senderId,
        userType: message.senderType,
        isTyping: false
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });
  });
  
  // Set up authentication
  setupAuth(app);

  // Destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      console.log("[API] Destinations route called with query:", req.query);
      const featured = req.query.featured === "true";
      let destinationsData;
      
      if (req.query.featured) {
        console.log("[API] Fetching featured destinations");
        destinationsData = await storage.getFeaturedDestinations();
        console.log("[API] Featured destinations fetched:", 
          destinationsData ? `Count: ${destinationsData.length}` : "No data");
      } else {
        console.log("[API] Fetching all destinations");
        destinationsData = await storage.getAllDestinations();
        console.log("[API] All destinations fetched:", 
          destinationsData ? `Count: ${destinationsData.length}` : "No data");
      }
      
      console.log("[API] Returning destinations data");
      return res.json(destinationsData);
    } catch (error) {
      console.error("[API] Error in destinations route:", error);
      // Return details of the error for debugging
      return res.status(500).json({ 
        error: "Failed to fetch destinations", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.get("/api/destinations/:id", async (req, res) => {
    try {
      const destination = await storage.getDestination(parseInt(req.params.id));
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      res.json(destination);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destination" });
    }
  });

  // Packages
  app.get("/api/packages", async (req, res) => {
    try {
      let packagesData;
      if (req.query.featured === "true") {
        packagesData = await storage.getFeaturedPackages();
      } else if (req.query.destinationId) {
        packagesData = await storage.getPackagesByDestination(parseInt(req.query.destinationId as string));
      } else {
        packagesData = await storage.getAllPackages();
      }
      res.json(packagesData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.get("/api/packages/:id", async (req, res) => {
    try {
      const packageData = await storage.getPackage(parseInt(req.params.id));
      if (!packageData) {
        return res.status(404).json({ error: "Package not found" });
      }
      res.json(packageData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch package" });
    }
  });

  // Hotels
  app.get("/api/hotels", async (req, res) => {
    try {
      let hotelsData;
      if (req.query.featured === "true") {
        hotelsData = await storage.getFeaturedHotels();
      } else if (req.query.destinationId) {
        hotelsData = await storage.getHotelsByDestination(parseInt(req.query.destinationId as string));
      } else {
        hotelsData = await storage.getAllHotels();
      }
      res.json(hotelsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hotels" });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotel = await storage.getHotel(parseInt(req.params.id));
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hotel" });
    }
  });

  // User
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      // @ts-ignore - req.user is added by passport
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove sensitive data before sending
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Guest Conversations
  app.get("/api/guest-conversations", async (req, res) => {
    try {
      const guestUserId = req.query.guestUserId as string;
      
      if (!guestUserId) {
        return res.status(400).json({ error: "Guest user ID is required" });
      }
      
      const guestUser = await storage.getGuestUserBySessionId(guestUserId);
      if (!guestUser) {
        return res.json([]);
      }
      
      const conversations = await storage.getConversationsByGuestUser(guestUser.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching guest conversations:", error);
      res.status(500).json({ error: "Failed to fetch guest conversations" });
    }
  });

  // Drivers (Cabs)
  app.get("/api/drivers", async (req, res) => {
    try {
      let driversData;
      if (req.query.destinationId) {
        driversData = await storage.getDriversByDestination(parseInt(req.query.destinationId as string));
      } else {
        driversData = await storage.getAllDrivers();
      }
      res.json(driversData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.getDriver(parseInt(req.params.id));
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  // Cruises
  app.get("/api/cruises", async (req, res) => {
    try {
      let cruisesData;
      if (req.query.featured === "true") {
        cruisesData = await storage.getFeaturedCruises();
      } else {
        cruisesData = await storage.getAllCruises();
      }
      res.json(cruisesData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });

  app.get("/api/cruises/:id", async (req, res) => {
    try {
      const cruise = await storage.getCruise(parseInt(req.params.id));
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cruise" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      let eventsData;
      if (req.query.destinationId) {
        eventsData = await storage.getEventsByDestination(parseInt(req.query.destinationId as string));
      } else {
        eventsData = await storage.getAllEvents();
      }
      res.json(eventsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Reviews
  app.get("/api/reviews/:itemType/:itemId", async (req, res) => {
    try {
      const { itemType, itemId } = req.params;
      
      // Get reviews for the specified item
      const reviewsData = await db.select({
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
      .where(
        and(
          eq(reviews.itemType, itemType),
          eq(reviews.itemId, parseInt(itemId)),
          eq(reviews.status, "approved")
        )
      )
      .orderBy(desc(reviews.createdAt));
      
      // Transform the data to the expected format
      const formattedReviews = reviewsData.map(item => ({
        ...item.review,
        user: item.user
      }));
      
      res.json(formattedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      console.log("Processing review submission from user:", req.user?.id);
      
      // Create a properly typed review data object
      const reviewData = {
        userId: req.user!.id,
        itemType: req.body.itemType as string,
        itemId: parseInt(req.body.itemId),
        rating: parseInt(req.body.rating),
        title: req.body.title as string,
        comment: req.body.comment as string,
        status: "approved" as const, 
        helpfulVotes: 0,
        verified: Boolean(req.body.dateOfStay),
        dateOfStay: req.body.dateOfStay ? new Date(req.body.dateOfStay) : undefined,
        images: req.body.images || undefined,
      };
      
      console.log("Prepared review data:", reviewData);
      
      // Insert the review into the database
      const [newReview] = await db
        .insert(reviews)
        .values(reviewData)
        .returning();
      
      console.log("Successfully inserted review with ID:", newReview.id);
      
      // Also return the user data
      const userData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username
        })
        .from(users)
        .where(eq(users.id, req.user!.id));
      
      const reviewWithUser = {
        ...newReview,
        user: userData[0]
      };
      
      res.status(201).json(reviewWithUser);
    } catch (error) {
      console.error("Error creating review:", error);
      // Provide more detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create review", details: errorMessage });
    }
  });

  // Admin review management
  app.get("/api/reviews/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allReviews = await db
        .select({
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
      
      // Transform the data
      const formattedReviews = allReviews.map(item => ({
        ...item.review,
        user: item.user
      }));
      
      res.json(formattedReviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.put("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // Update the review
      const [updatedReview] = await db
        .update(reviews)
        .set(req.body)
        .where(eq(reviews.id, parseInt(req.params.id)))
        .returning();
      
      if (!updatedReview) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Get the user data
      const userData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username
        })
        .from(users)
        .where(eq(users.id, updatedReview.userId));
      
      const reviewWithUser = {
        ...updatedReview,
        user: userData[0]
      };
      
      res.json(reviewWithUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await db
        .delete(reviews)
        .where(eq(reviews.id, parseInt(req.params.id)));
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Bookings - Protected routes
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const userBookings = await storage.getBookingsByUser(req.user!.id);
      res.json(userBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Check if the booking belongs to the user
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const bookingData = {
        ...req.body,
        userId: req.user!.id,
        status: "pending",
        paymentStatus: "unpaid"
      };
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.post("/api/bookings/:id/payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Check if the booking belongs to the user
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Process payment (in a real system, this would integrate with a payment provider)
      const updatedBooking = await storage.updateBooking(parseInt(req.params.id), {
        status: "confirmed",
        paymentStatus: "paid"
      });
      
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // Admin API routes
  // Dashboard analytics
  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // Get booking counts by type
      const bookingCounts = await storage.getBookingCountsByType();
      
      // Get revenue data
      const revenueData = await storage.getRevenueData();
      
      // Get recent bookings
      const recentBookings = await storage.getRecentBookings(5);
      
      // Get total counts
      const [
        userCount,
        destinationCount,
        packageCount,
        hotelCount,
        driverCount,
        cruiseCount,
        eventCount,
        bookingCount
      ] = await Promise.all([
        storage.getUserCount(),
        storage.getDestinationCount(),
        storage.getPackageCount(),
        storage.getHotelCount(),
        storage.getDriverCount(),
        storage.getCruiseCount(),
        storage.getEventCount(),
        storage.getBookingCount()
      ]);
      
      res.json({
        bookingCounts,
        revenueData,
        recentBookings,
        counts: {
          users: userCount,
          destinations: destinationCount,
          packages: packageCount,
          hotels: hotelCount,
          drivers: driverCount,
          cruises: cruiseCount,
          events: eventCount,
          bookings: bookingCount
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Admin listing routes
  app.get("/api/destinations/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allDestinations = await storage.getAllDestinations();
      res.json(allDestinations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  app.get("/api/packages/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allPackages = await storage.getAllPackages();
      res.json(allPackages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.get("/api/hotels/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allHotels = await storage.getAllHotels();
      res.json(allHotels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hotels" });
    }
  });
  
  // Hotel Room Types
  app.get("/api/hotel-room-types/:hotelId", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      
      const roomTypes = await db
        .select()
        .from(hotelRoomTypes)
        .where(eq(hotelRoomTypes.hotelId, hotelId))
        .orderBy(asc(hotelRoomTypes.name));
      
      res.json(roomTypes);
    } catch (error) {
      console.error("Error fetching room types:", error);
      res.status(500).json({ error: "Failed to fetch room types" });
    }
  });
  
  app.get("/api/hotel-room-types/:id/images", async (req, res) => {
    try {
      const roomTypeId = parseInt(req.params.id);
      
      const images = await db
        .select()
        .from(hotelRoomImages)
        .where(eq(hotelRoomImages.roomTypeId, roomTypeId))
        .orderBy(asc(hotelRoomImages.displayOrder));
      
      res.json(images);
    } catch (error) {
      console.error("Error fetching room images:", error);
      res.status(500).json({ error: "Failed to fetch room images" });
    }
  });
  
  // Admin routes for room types and images
  app.post("/api/hotel-room-types", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const [roomType] = await db
        .insert(hotelRoomTypes)
        .values(req.body)
        .returning();
      
      res.status(201).json(roomType);
    } catch (error) {
      console.error("Error creating room type:", error);
      res.status(500).json({ error: "Failed to create room type" });
    }
  });
  
  app.put("/api/hotel-room-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const [updatedRoomType] = await db
        .update(hotelRoomTypes)
        .set(req.body)
        .where(eq(hotelRoomTypes.id, parseInt(req.params.id)))
        .returning();
      
      if (!updatedRoomType) {
        return res.status(404).json({ error: "Room type not found" });
      }
      
      res.json(updatedRoomType);
    } catch (error) {
      console.error("Error updating room type:", error);
      res.status(500).json({ error: "Failed to update room type" });
    }
  });
  
  app.delete("/api/hotel-room-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await db
        .delete(hotelRoomTypes)
        .where(eq(hotelRoomTypes.id, parseInt(req.params.id)));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting room type:", error);
      res.status(500).json({ error: "Failed to delete room type" });
    }
  });
  
  // Room images management
  app.post("/api/hotel-room-images", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const [roomImage] = await db
        .insert(hotelRoomImages)
        .values(req.body)
        .returning();
      
      res.status(201).json(roomImage);
    } catch (error) {
      console.error("Error adding room image:", error);
      res.status(500).json({ error: "Failed to add room image" });
    }
  });
  
  app.put("/api/hotel-room-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const [updatedImage] = await db
        .update(hotelRoomImages)
        .set(req.body)
        .where(eq(hotelRoomImages.id, parseInt(req.params.id)))
        .returning();
      
      if (!updatedImage) {
        return res.status(404).json({ error: "Room image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating room image:", error);
      res.status(500).json({ error: "Failed to update room image" });
    }
  });
  
  app.delete("/api/hotel-room-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await db
        .delete(hotelRoomImages)
        .where(eq(hotelRoomImages.id, parseInt(req.params.id)));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting room image:", error);
      res.status(500).json({ error: "Failed to delete room image" });
    }
  });

  // Routes for drivers admin have been moved to server/routes/admin-drivers.ts

  // Routes for cruises admin have been moved to server/routes/admin-cruises.ts

  // Routes for events admin have been moved to server/routes/admin-events.ts

  app.get("/api/users/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // This would typically come from storage but we don't have a method for it yet
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/bookings/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Admin specific analytics endpoints
  app.get("/api/admin/analytics/booking-stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const bookingCounts = await storage.getBookingCountsByType();
      res.json(bookingCounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking statistics" });
    }
  });

  app.get("/api/admin/analytics/sales-data", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const revenueData = await storage.getRevenueData();
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  app.get("/api/admin/analytics/popular-destinations", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // This would typically come from a specialized method but we'll mock it for now
      const destinations = await storage.getFeaturedDestinations();
      const popularDestinations = destinations.map(dest => ({
        id: dest.id,
        name: dest.name,
        bookings: Math.floor(Math.random() * 100) + 1 // Mock data
      }));
      res.json(popularDestinations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular destinations" });
    }
  });

  // Admin CRUD operations for destinations
  app.post("/api/admin/destinations", async (req, res) => {
    try {
      const destination = await storage.createDestination(req.body);
      res.status(201).json(destination);
    } catch (error) {
      res.status(500).json({ error: "Failed to create destination" });
    }
  });

  app.put("/api/admin/destinations/:id", async (req, res) => {
    try {
      const destination = await storage.updateDestination(parseInt(req.params.id), req.body);
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      res.json(destination);
    } catch (error) {
      res.status(500).json({ error: "Failed to update destination" });
    }
  });

  app.delete("/api/admin/destinations/:id", async (req, res) => {
    try {
      await storage.deleteDestination(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete destination" });
    }
  });

  // Admin CRUD operations for packages
  app.post("/api/admin/packages", async (req, res) => {
    try {
      const packageData = await storage.createPackage(req.body);
      res.status(201).json(packageData);
    } catch (error) {
      res.status(500).json({ error: "Failed to create package" });
    }
  });

  app.put("/api/admin/packages/:id", async (req, res) => {
    try {
      const packageData = await storage.updatePackage(parseInt(req.params.id), req.body);
      if (!packageData) {
        return res.status(404).json({ error: "Package not found" });
      }
      res.json(packageData);
    } catch (error) {
      res.status(500).json({ error: "Failed to update package" });
    }
  });

  app.delete("/api/admin/packages/:id", async (req, res) => {
    try {
      await storage.deletePackage(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete package" });
    }
  });

  // Admin CRUD operations for hotels
  app.post("/api/admin/hotels", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const hotel = await storage.createHotel(req.body);
      res.status(201).json(hotel);
    } catch (error) {
      res.status(500).json({ error: "Failed to create hotel" });
    }
  });

  app.put("/api/admin/hotels/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // Log the incoming data for debugging
      console.log("Updating hotel with ID:", req.params.id);
      console.log("Received data:", req.body);
      
      // Process the data to ensure proper format for text fields
      const data = { ...req.body };
      
      // Process special fields that might need string conversion
      if (data.nearbyAttractions && Array.isArray(data.nearbyAttractions)) {
        data.nearbyAttractions = data.nearbyAttractions.join('\n');
      }
      
      if (data.amenities && Array.isArray(data.amenities)) {
        data.amenities = data.amenities.join('\n');
      }
      
      if (data.languagesSpoken && Array.isArray(data.languagesSpoken)) {
        data.languagesSpoken = data.languagesSpoken.join('\n');
      }
      
      console.log("Processed data for DB:", data);
      
      const hotel = await storage.updateHotel(parseInt(req.params.id), data);
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      console.error("Error updating hotel:", error);
      res.status(500).json({ error: "Failed to update hotel" });
    }
  });

  app.delete("/api/admin/hotels/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await storage.deleteHotel(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete hotel" });
    }
  });

  // Admin CRUD operations for drivers
  app.post("/api/admin/drivers", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const driver = await storage.createDriver(req.body);
      res.status(201).json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/admin/drivers/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const driver = await storage.updateDriver(parseInt(req.params.id), req.body);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/admin/drivers/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await storage.deleteDriver(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Admin CRUD operations for cruises
  app.post("/api/admin/cruises", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cruise = await storage.createCruise(req.body);
      res.status(201).json(cruise);
    } catch (error) {
      res.status(500).json({ error: "Failed to create cruise" });
    }
  });

  app.put("/api/admin/cruises/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cruise = await storage.updateCruise(parseInt(req.params.id), req.body);
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cruise" });
    }
  });
  
  // Cruise Cabin Types endpoints
  app.get("/api/cruises/:cruiseId/cabin-types", async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const cabinTypes = await storage.getCruiseCabinTypes(cruiseId);
      res.json(cabinTypes);
    } catch (error) {
      console.error("Error fetching cabin types:", error);
      res.status(500).json({ error: "Failed to fetch cabin types" });
    }
  });
  
  // Add PATCH endpoint for cabin types that matches client URL pattern
  app.patch("/api/cruises/:cruiseId/cabin-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cabinTypeId = parseInt(req.params.id);
      const cruiseId = parseInt(req.params.cruiseId);
      
      // Add cruiseId to the data
      const updateData = {
        ...req.body,
        cruiseId
      };
      
      const cabinType = await storage.updateCruiseCabinType(cabinTypeId, updateData);
      
      if (!cabinType) {
        return res.status(404).json({ error: "Cabin type not found" });
      }
      
      res.json(cabinType);
    } catch (error) {
      console.error("Error updating cabin type:", error);
      res.status(500).json({ error: "Failed to update cabin type" });
    }
  });
  
  // Add POST endpoint for cabin types that matches client URL pattern
  app.post("/api/cruises/:cruiseId/cabin-types", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const cabinTypeData = {
        ...req.body,
        cruiseId,
      };
      
      const cabinType = await storage.createCruiseCabinType(cabinTypeData);
      res.status(201).json(cabinType);
    } catch (error) {
      console.error("Error creating cabin type:", error);
      res.status(500).json({ error: "Failed to create cabin type" });
    }
  });

  app.post("/api/admin/cruises/:cruiseId/cabin-types", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const cabinTypeData = {
        ...req.body,
        cruiseId,
      };
      
      const cabinType = await storage.createCruiseCabinType(cabinTypeData);
      res.status(201).json(cabinType);
    } catch (error) {
      console.error("Error creating cabin type:", error);
      res.status(500).json({ error: "Failed to create cabin type" });
    }
  });

  app.put("/api/admin/cruises/cabin-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cabinTypeId = parseInt(req.params.id);
      const cabinType = await storage.updateCruiseCabinType(cabinTypeId, req.body);
      
      if (!cabinType) {
        return res.status(404).json({ error: "Cabin type not found" });
      }
      
      res.json(cabinType);
    } catch (error) {
      console.error("Error updating cabin type:", error);
      res.status(500).json({ error: "Failed to update cabin type" });
    }
  });

  app.delete("/api/admin/cruises/cabin-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cabinTypeId = parseInt(req.params.id);
      await storage.deleteCruiseCabinType(cabinTypeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cabin type:", error);
      res.status(500).json({ error: "Failed to delete cabin type" });
    }
  });
  
  // Add DELETE endpoint for cabin types that matches client URL pattern
  app.delete("/api/cruises/:cruiseId/cabin-types/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const cabinTypeId = parseInt(req.params.id);
      await storage.deleteCruiseCabinType(cabinTypeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cabin type:", error);
      res.status(500).json({ error: "Failed to delete cabin type" });
    }
  });

  app.delete("/api/admin/cruises/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await storage.deleteCruise(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cruise" });
    }
  });

  // Admin CRUD operations for events
  app.post("/api/admin/events", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const event = await storage.updateEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      await storage.deleteEvent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Admin booking management
  app.get("/api/admin/bookings", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.put("/api/admin/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const booking = await storage.updateBooking(parseInt(req.params.id), req.body);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Chat API - Guest user creation
  app.post("/api/guest-users", async (req, res) => {
    try {
      // Create a guest user account
      const guestUserData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        sessionId: req.sessionID,
      };
      
      // Check if a guest user with this session already exists
      let guestUser = await storage.getGuestUserBySessionId(req.sessionID);
      
      if (!guestUser) {
        // If not exists, create a new guest user
        guestUser = await storage.createGuestUser(guestUserData);
      }
      
      res.status(201).json(guestUser);
    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({ error: "Failed to create guest user" });
    }
  });
  
  // Create a conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      let guestUserId = null;
      
      // Handle guest user creation if needed
      if (!req.isAuthenticated()) {
        // Create guest user if not already present
        if (req.body.guestName && req.body.guestEmail) {
          console.log("Creating or finding guest user for inquiry");
          
          // First check if guest user already exists with this session ID
          let guestUser = await storage.getGuestUserBySessionId(req.sessionID);
          
          if (!guestUser) {
            // Only create if user doesn't exist
            guestUser = await storage.createGuestUser({
              firstName: req.body.guestName.split(' ')[0] || req.body.guestName,
              lastName: req.body.guestName.split(' ').slice(1).join(' ') || '-',
              email: req.body.guestEmail,
              phoneNumber: req.body.guestPhone || '',
              sessionId: req.sessionID,
            });
            console.log(`Created new guest user with ID: ${guestUser.id}`);
          } else {
            console.log(`Found existing guest user with ID: ${guestUser.id}`);
          }
          
          guestUserId = guestUser.id;
        } else if (req.body.guestUserId) {
          // Use existing guest user ID if provided
          guestUserId = req.body.guestUserId;
        } else {
          return res.status(400).json({ error: "Must provide guest user information or be logged in" });
        }
      }
      
      // Create conversation with the correct status enum value
      const conversationData = {
        userId: req.isAuthenticated() ? req.user!.id : null,
        guestUserId: !req.isAuthenticated() ? guestUserId : null,
        itemType: req.body.itemType || 'inquiry',
        itemId: req.body.itemId || 0,
        subject: req.body.subject || "General Inquiry",
        status: 'open' as const, // Type assertion to match the enum
      };
      
      const conversation = await storage.createConversation(conversationData);
      
      // Create the first message if provided
      let message = null;
      if (req.body.message) {
        // Determine the sender ID and type
        let senderId = 0;
        let senderType = '';
        
        if (req.isAuthenticated()) {
          senderId = req.user!.id;
          senderType = req.user!.role === 'admin' ? 'admin' : 'user';
        } else if (guestUserId) {
          senderId = guestUserId;
          senderType = 'guest';
        }
        
        const messageData = {
          conversationId: conversation.id,
          senderId,
          senderType,
          content: req.body.message,
          messageType: 'text' as const,
          fileUrl: null,
        };
        
        message = await storage.createMessage(messageData);
      }
      
      // Send an automatic welcome message for guest chats, even before they send the first message
      if (!req.isAuthenticated() && guestUserId && req.body.itemType === 'livechat') {
        // Format the WhatsApp link properly for better visibility
        const whatsAppLink = '<a href="https://wa.me/+918062407920" class="wa-btn" style="display:inline-flex;align-items:center;background:#25D366;color:white;padding:8px 12px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:5px;margin-bottom:5px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white" style="margin-right:5px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp Us</a>';
        
        // Auto welcome message for new conversations
        const aiWelcomeMessage = `Welcome to Travel Ease by Expedia! Thank you for contacting us. Please type your question, and one of our travel specialists will assist you shortly.\n\n⚡ For immediate assistance: ${whatsAppLink}`;
        
        // Create the automatic system message
        const aiMessageData = {
          conversationId: conversation.id,
          senderId: 0, // System message
          senderType: 'system',
          content: aiWelcomeMessage,
          messageType: 'text' as const,
          fileUrl: null,
        };
        
        const autoMessage = await storage.createMessage(aiMessageData);
        
        // Log the automated response
        console.log(`Sent automated welcome message for new guest chat conversation ${conversation.id}`);
        
        // Add the auto message to the socket.io broadcast
        if (autoMessage) {
          io.to(`conversation-${conversation.id}`).emit('message-received', autoMessage);
        }
      }
      
      // Emit socket event for new conversation - broadcast to all connected clients
      io.emit('new-conversation', {
        id: conversation.id,
        subject: conversation.subject,
        createdAt: conversation.createdAt
      });
      console.log(`Emitted new-conversation event for conversation ${conversation.id}`);
      
      // If there's a first message, also emit the new message event
      if (message) {
        io.to(`conversation-${conversation.id}`).emit('message-received', message);
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  
  // Add message to conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check authorization
      if (req.isAuthenticated()) {
        // For authenticated users, check if conversation belongs to them
        if (conversation.userId && conversation.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (conversation.guestUserId) {
        // For guest users, check if the guest user in the session matches
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (!guestUser || guestUser.id !== conversation.guestUserId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Create the message
      const isAdmin = req.isAuthenticated() && req.user!.role === 'admin';
      let senderId = 0;
      let senderType = '';
      
      if (req.isAuthenticated()) {
        senderId = req.user!.id;
        senderType = isAdmin ? 'admin' : 'user';
      } else if (conversation.guestUserId) {
        senderId = conversation.guestUserId;
        senderType = 'guest';
      }
      
      const messageData = {
        conversationId,
        senderId,
        senderType,
        content: req.body.content,
        messageType: req.body.messageType || 'text',
        fileUrl: req.body.fileUrl,
      };
      
      const message = await storage.createMessage(messageData);
      
      // Update conversation status if needed
      if (conversation.status === 'pending') {
        await storage.updateConversation(conversationId, { status: 'open' });
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });
  
  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check authorization
      if (req.isAuthenticated()) {
        // For authenticated users, check if conversation belongs to them
        if (conversation.userId && conversation.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (conversation.guestUserId) {
        // For guest users, check if the guest user in the session matches
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (!guestUser || guestUser.id !== conversation.guestUserId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get messages
      const messages = await storage.getMessagesByConversation(conversationId);
      
      // Mark messages as read
      if (req.isAuthenticated() && req.user!.role === 'admin') {
        await storage.markMessagesAsReadByAdmin(conversationId);
      } else {
        await storage.markMessagesAsReadByUser(conversationId);
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Get user's conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      let conversations;
      
      if (req.isAuthenticated()) {
        if (req.user!.role === 'admin') {
          // Admin gets all active conversations
          conversations = await storage.getActiveConversations();
        } else {
          // Regular user gets their own conversations
          conversations = await storage.getConversationsByUser(req.user!.id);
        }
      } else {
        // Guest user gets conversations tied to their session
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (!guestUser) {
          return res.status(404).json({ error: "Guest user not found" });
        }
        conversations = await storage.getConversationsByGuestUser(guestUser.id);
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get a single conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check authorization
      if (req.isAuthenticated()) {
        // For authenticated users, check if conversation belongs to them
        if (conversation.userId && conversation.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (conversation.guestUserId) {
        // For guest users, check if the guest user in the session matches
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (!guestUser || guestUser.id !== conversation.guestUserId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  
  // Close a conversation
  app.put("/api/conversations/:id/close", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Only admins and conversation owners can close conversations
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (req.user!.role !== 'admin' && conversation.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Close the conversation
      const updatedConversation = await storage.closeConversation(conversationId);
      res.json(updatedConversation);
    } catch (error) {
      console.error("Error closing conversation:", error);
      res.status(500).json({ error: "Failed to close conversation" });
    }
  });
  
  // Admin statistics for chat
  app.get("/api/admin/chat-stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const unreadMessageCount = await storage.getUnreadMessageCountForAdmin();
      res.json({ unreadMessageCount });
    } catch (error) {
      console.error("Error fetching chat stats:", error);
      res.status(500).json({ error: "Failed to fetch chat statistics" });
    }
  });
  
  // Get conversations for authenticated users
  app.get("/api/user-conversations", async (req, res) => {
    try {
      let conversationsData: Conversation[] = [];
      
      if (req.isAuthenticated()) {
        // Get authenticated user's conversations
        const userId = req.user!.id;
        console.log(`Fetching conversations for authenticated user ${userId}`);
        
        if (req.user!.role === 'admin') {
          console.log('Admin user detected, fetching all conversations');
          conversationsData = await storage.getAllConversations();
        } else {
          conversationsData = await storage.getConversationsByUser(userId);
        }
      } else {
        // Not authenticated
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      res.json(conversationsData);
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Direct database access for admin panel
  app.get("/api/direct/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      console.log('Admin accessing direct conversations endpoint');
      const conversationsData = await storage.getAllConversations();
      
      // Convert field unreadByAdmin to a boolean property if needed
      const formattedConversations = conversationsData.map(conversation => ({
        ...conversation,
        unreadByAdmin: !conversation.readByAdmin
      }));
      
      res.json(formattedConversations);
    } catch (error) {
      console.error("Error fetching all conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get conversations for guest users
  app.get("/api/guest-conversations", async (req, res) => {
    try {
      let conversationsData: Conversation[] = [];
      
      // Check if a specific guestUserId is provided in the query params (for persistence)
      const guestUserId = req.query.guestUserId ? parseInt(req.query.guestUserId as string) : null;
      
      if (guestUserId) {
        // If a specific guestUserId is provided, use that directly
        console.log(`Using provided guestUserId: ${guestUserId}`);
        conversationsData = await storage.getConversationsByGuestUser(guestUserId);
        console.log(`Found ${conversationsData.length} conversations for guest user ${guestUserId}`);
      } else {
        // Otherwise, try to find the guest user by session ID
        console.log(`Checking for guest user with session ID: ${req.sessionID}`);
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        
        if (guestUser) {
          console.log(`Found guest user with ID ${guestUser.id} for session ${req.sessionID}`);
          conversationsData = await storage.getConversationsByGuestUser(guestUser.id);
          console.log(`Found ${conversationsData.length} conversations for guest user ${guestUser.id}`);
        } else {
          console.log(`No guest user found for session ${req.sessionID}`);
        }
      }
      
      res.json(conversationsData);
    } catch (error) {
      console.error("Error fetching guest conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get a specific conversation by ID
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      console.log(`Found conversation: ${JSON.stringify(conversation)}`);
      
      // Check authorization
      let hasAccess = false;
      
      if (req.isAuthenticated()) {
        // Admin can access any conversation
        if (req.user!.role === 'admin') {
          console.log('Admin user has access');
          hasAccess = true;
        }
        // User can access their own conversations
        else if (conversation.userId === req.user!.id) {
          console.log('User has access to their conversation');
          hasAccess = true;
        }
      } else if (conversation.guestUserId) {
        // For guest users, check if the session matches
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        
        if (guestUser && guestUser.id === conversation.guestUserId) {
          console.log('Guest user has access to their conversation');
          hasAccess = true;
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      return res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.query.conversationId as string);
      const guestUserId = req.query.guestUserId ? parseInt(req.query.guestUserId as string) : null;
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      console.log(`Fetching messages for conversation ID: ${conversationId}`);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        console.log(`Conversation ID ${conversationId} not found`);
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      console.log(`Found conversation:`, JSON.stringify(conversation));
      
      // Check authorization
      let authorized = false;
      
      if (req.isAuthenticated()) {
        console.log(`Authenticated user checking access: ${req.user!.id}, role: ${req.user!.role}`);
        if (req.user!.role === 'admin') {
          console.log('Admin user has access');
          authorized = true;
        } else if (conversation.userId === req.user!.id) {
          console.log('User matches conversation userId, access granted');
          authorized = true;
        } else {
          console.log(`User ${req.user!.id} does not match conversation userId ${conversation.userId}`);
        }
      } else if (conversation.guestUserId) {
        // First check if guestUserId was directly provided in the query
        const guestUserIdNum = typeof guestUserId === 'string' ? Number(guestUserId) : guestUserId;
        if (guestUserId && guestUserIdNum === conversation.guestUserId) {
          console.log(`Guest ID in query (${guestUserId}, parsed: ${guestUserIdNum}) matches conversation ${conversation.guestUserId}, granting direct access`);
          authorized = true;
        } else {
          // Fall back to session-based guest verification
          console.log(`Guest access check for session: ${req.sessionID}`);
          const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
          if (guestUser) {
            console.log(`Found guest user: ${guestUser.id}`);
            if (guestUser.id === conversation.guestUserId) {
              console.log('Guest user matches conversation, access granted');
              authorized = true;
            } else {
              console.log(`Guest user ${guestUser.id} does not match conversation guestUserId ${conversation.guestUserId}`);
            }
          } else {
            console.log(`No guest user found for session: ${req.sessionID}`);
          }
        }
      } else {
        console.log('No guest user ID in conversation and user not authenticated');
      }
      
      if (!authorized) {
        console.log('Access denied to conversation');
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessagesByConversation(conversationId);
      console.log(`Found ${messages.length} messages for conversation ${conversationId}`);
      
      if (messages.length > 0) {
        console.log('First message sample:', JSON.stringify(messages[0]));
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Direct message sending for guests
  app.post("/api/guest-send-message", async (req, res) => {
    try {
      const { conversationId, message, guestUserId } = req.body;
      
      console.log(`Guest sending message for conversation ${conversationId} with guestUserId ${guestUserId}`);
      
      if (!conversationId || !message || !guestUserId) {
        return res.status(400).json({ error: "Conversation ID, message, and guestUserId are required" });
      }
      
      // Parse IDs to ensure they're numbers
      const conversationIdNum = typeof conversationId === 'string' ? parseInt(conversationId) : conversationId;
      const guestUserIdNum = typeof guestUserId === 'string' ? parseInt(guestUserId) : guestUserId;
      
      if (isNaN(conversationIdNum) || isNaN(guestUserIdNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      console.log(`Parsed IDs: conversationId=${conversationIdNum}, guestUserId=${guestUserIdNum}`);
      
      const conversation = await storage.getConversation(conversationIdNum);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Only check if guestUserId matches the conversation
      if (conversation.guestUserId !== guestUserIdNum) {
        return res.status(403).json({ 
          error: "Access denied - guest ID doesn't match conversation",
          expected: conversation.guestUserId,
          received: guestUserIdNum
        });
      }
      
      // Create the message directly
      const messageData = {
        conversationId: conversationIdNum,
        senderId: guestUserIdNum,
        senderType: 'guest',
        content: message,
        messageType: 'text' as const,
        fileUrl: null,
      };
      
      const newMessage = await storage.createMessage(messageData);
      
      // Mark messages as read by user
      await storage.markMessagesAsReadByUser(conversationIdNum);
      
      // Ensure conversation is open
      await storage.updateConversation(conversationIdNum, {
        status: 'open',
      });
      
      // Emit socket event for real-time updates
      io.to(`conversation-${conversationIdNum}`).emit('message-received', newMessage);
      
      // Send an automated AI response after a short delay
      setTimeout(async () => {
        try {
          // Generate an automated response based on the user's message
          let aiResponse = "";
          
          // Check if this is the first message (need engagement welcome)
          const messageCount = await storage.getMessageCountForConversation(conversationIdNum);
          
          // Format the WhatsApp link properly for better visibility
          const whatsAppLink = '<a href="https://wa.me/+918062407920" class="wa-btn" style="display:inline-flex;align-items:center;background:#25D366;color:white;padding:8px 12px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:5px;margin-bottom:5px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white" style="margin-right:5px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp Us</a>';
          
          if (messageCount <= 2) { // First user message + our first auto-response
            aiResponse = `Thank you for contacting Travel Ease by Expedia! Please hold while we connect you with a travel specialist. One of our agents will be with you shortly.\n\n⚡ For immediate assistance: ${whatsAppLink}`;
          } else {
            // Choose an appropriate response based on message content
            const lowercaseMessage = message.toLowerCase();
            
            if (lowercaseMessage.includes("book") || lowercaseMessage.includes("reservation") || lowercaseMessage.includes("booking")) {
              aiResponse = `Thanks for your interest in booking with us! Our agents are currently assisting other customers. Please hold and an agent will help you complete your reservation shortly.\n\n⚡ For immediate booking assistance: ${whatsAppLink}`;
            } 
            else if (lowercaseMessage.includes("cancel") || lowercaseMessage.includes("refund")) {
              aiResponse = `I understand you have a question about cancellations or refunds. Our customer service team will be with you shortly to address your concerns.\n\n⚡ For immediate assistance with your booking: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("price") || lowercaseMessage.includes("cost") || lowercaseMessage.includes("discount")) {
              aiResponse = `Thank you for your inquiry about pricing. Our travel specialists will be with you shortly to provide you with detailed pricing information and any available discounts.\n\n⚡ For immediate pricing questions: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("package") || lowercaseMessage.includes("tour")) {
              aiResponse = `Thank you for your interest in our travel packages! Our team will be with you shortly to help you find the perfect tour package for your needs.\n\n⚡ For immediate assistance with packages: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("hotel") || lowercaseMessage.includes("accommodation") || lowercaseMessage.includes("room")) {
              aiResponse = `Thank you for your interest in our hotel accommodations! Our hotel specialists will be with you shortly to help you find the perfect stay.\n\n⚡ For immediate assistance with accommodations: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("cruise") || lowercaseMessage.includes("ship") || lowercaseMessage.includes("cabin")) {
              aiResponse = `Thank you for your interest in our cruise offerings! Our cruise specialists will be with you shortly to help you find the perfect voyage.\n\n⚡ For immediate assistance with cruise bookings: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("payment") || lowercaseMessage.includes("pay") || lowercaseMessage.includes("card")) {
              aiResponse = `Thank you for your inquiry about payment options. Our payment specialists will be with you shortly to assist with your transaction.\n\n⚡ For immediate assistance with payments: ${whatsAppLink}`;
            }
            else if (lowercaseMessage.includes("itinerary") || lowercaseMessage.includes("schedule") || lowercaseMessage.includes("plan")) {
              aiResponse = `Thank you for your inquiry about travel itineraries. Our travel planners will be with you shortly to help you plan your perfect trip.\n\n⚡ For immediate itinerary assistance: ${whatsAppLink}`;
            }
            else {
              aiResponse = `Thank you for your message. Our team is reviewing your inquiry and will respond shortly. We appreciate your patience.\n\n⚡ For immediate assistance: ${whatsAppLink}`;
            }
          }
          
          // Create an automatic response message from the system
          const aiMessageData = {
            conversationId: conversationIdNum,
            senderId: 0, // System/AI sender ID
            senderType: 'admin',
            content: aiResponse,
            messageType: 'text' as const,
            fileUrl: null,
          };
          
          const aiResponseMessage = await storage.createMessage(aiMessageData);
          
          // Mark the conversation as needing admin attention (open and unread)
          await storage.updateConversation(conversationIdNum, {
            status: 'open',
            readByAdmin: false // This is valid in the schema
          });
          
          // Emit the automated response to the client
          io.to(`conversation-${conversationIdNum}`).emit('message-received', aiResponseMessage);
          
          console.log(`Sent automated response for conversation ${conversationIdNum}`);
        } catch (error) {
          console.error("Error sending automated response:", error);
        }
      }, 2000); // 2-second delay to make it seem more natural
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending guest message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const { conversationId, message, guestUserId } = req.body;
      
      console.log(`Sending message for conversation ID: ${conversationId}`, message);
      
      if (!conversationId || !message) {
        console.log('Missing conversation ID or message content');
        return res.status(400).json({ error: "Conversation ID and message are required" });
      }
      
      const conversation = await storage.getConversation(parseInt(conversationId));
      
      if (!conversation) {
        console.log(`Conversation ID ${conversationId} not found`);
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      console.log(`Found conversation for message:`, JSON.stringify(conversation));
      
      // Check authorization
      let authorized = false;
      let senderId = 0;
      let senderType = '';
      
      if (req.isAuthenticated()) {
        senderId = req.user!.id;
        senderType = req.user!.role === 'admin' ? 'admin' : 'user';
        console.log(`Authenticated user sending message: ${senderId}, role: ${senderType}`);
        
        if (req.user!.role === 'admin') {
          console.log('Admin user has access to send messages');
          authorized = true;
        } else if (conversation.userId === req.user!.id) {
          console.log('User matches conversation userId, can send message');
          authorized = true;
        } else {
          console.log(`User ${req.user!.id} doesn't match conversation userId ${conversation.userId}`);
        }
      } else if (conversation.guestUserId) {
        // First check if guestUserId was provided directly in the request
        const guestUserIdNum = typeof guestUserId === 'string' ? Number(guestUserId) : guestUserId;
        if (guestUserId && guestUserIdNum === conversation.guestUserId) {
          console.log(`Guest user ID provided in request (${guestUserId}, parsed: ${guestUserIdNum}) matches conversation guestUserId ${conversation.guestUserId}`);
          senderId = conversation.guestUserId;
          senderType = 'guest';
          authorized = true;
        } else {
          // Fall back to session-based guest user verification
          console.log(`Guest user trying to send message for session: ${req.sessionID}`);
          const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
          
          if (guestUser) {
            console.log(`Found guest user: ${guestUser.id}`);
            
            if (guestUser.id === conversation.guestUserId) {
              console.log('Guest user matches conversation, can send message');
              senderId = guestUser.id;
              senderType = 'guest';
              authorized = true;
            } else {
              console.log(`Guest user ${guestUser.id} doesn't match conversation guestUserId ${conversation.guestUserId}`);
            }
          } else {
            console.log(`No guest user found for session: ${req.sessionID}`);
          }
        }
      } else {
        console.log('No guest user ID in conversation and user not authenticated');
      }
      
      if (!authorized) {
        console.log('Access denied to send message');
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Create the message
      const messageData = {
        conversationId: parseInt(conversationId),
        senderId,
        senderType,
        content: message,
        messageType: 'text' as const,
        fileUrl: null,
      };
      
      console.log('Creating message with data:', JSON.stringify(messageData));
      const newMessage = await storage.createMessage(messageData);
      console.log('Message created successfully:', JSON.stringify(newMessage));
      
      // Update conversation's read status based on sender
      if (senderType === 'admin') {
        console.log('Marking messages as read by admin');
        await storage.markMessagesAsReadByAdmin(parseInt(conversationId));
      } else {
        console.log('Marking messages as read by user/guest');
        await storage.markMessagesAsReadByUser(parseInt(conversationId));
      }
      
      // Also update the status to ensure it's open
      console.log('Updating conversation status to open');
      await storage.updateConversation(parseInt(conversationId), {
        status: 'open',
      });
      
      // Emit socket event for real-time updates
      io.to(`conversation-${conversationId}`).emit('message-received', newMessage);
      console.log(`Socket event 'message-received' emitted to conversation-${conversationId}`);
      
      // Send an automated AI response after a short delay if the message is from a user or guest
      // Don't send auto-response to admin messages
      if (senderType !== 'admin') {
        setTimeout(async () => {
          try {
            console.log(`Generating auto-response for conversation ${conversationId}`);
            // Generate an automated response based on the user's message
            let aiResponse = "";
            
            // Format the WhatsApp link properly for better visibility
            const whatsAppLink = "https://wa.me/+918062407920";
            
            // Check if this is the first message (need engagement welcome)
            const messageCount = await storage.getMessageCountForConversation(parseInt(conversationId));
            console.log(`Message count for conversation ${conversationId}: ${messageCount}`);
            
            if (messageCount <= 2) { // First user message + our first auto-response
              aiResponse = `Thank you for contacting Travel Ease by Expedia! Please hold while we connect you with a travel specialist. One of our agents will be with you shortly.\n\n⚡ For immediate assistance, you can also reach us on WhatsApp: ${whatsAppLink}`;
            } else {
              // Choose an appropriate response based on message content
              const lowercaseMessage = message.toLowerCase();
              
              if (lowercaseMessage.includes("book") || lowercaseMessage.includes("reservation") || lowercaseMessage.includes("booking")) {
                aiResponse = `Thanks for your interest in booking with us! Our agents are currently assisting other customers. Please hold and an agent will help you complete your reservation shortly.\n\n⚡ For immediate booking assistance, please contact us on WhatsApp: ${whatsAppLink}`;
              } 
              else if (lowercaseMessage.includes("cancel") || lowercaseMessage.includes("refund")) {
                aiResponse = `I understand you have a question about cancellations or refunds. Our customer service team will be with you shortly to address your concerns.\n\n⚡ For immediate assistance with your booking, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("price") || lowercaseMessage.includes("cost") || lowercaseMessage.includes("discount")) {
                aiResponse = `Thank you for your inquiry about pricing. Our travel specialists will be with you shortly to provide you with detailed pricing information and any available discounts.\n\n⚡ For immediate pricing questions, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("package") || lowercaseMessage.includes("tour")) {
                aiResponse = `Thank you for your interest in our travel packages! Our team will be with you shortly to help you find the perfect tour package for your needs.\n\n⚡ For immediate assistance with packages, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("hotel") || lowercaseMessage.includes("accommodation") || lowercaseMessage.includes("room")) {
                aiResponse = `Thank you for your interest in our hotel accommodations! Our hotel specialists will be with you shortly to help you find the perfect stay.\n\n⚡ For immediate assistance with accommodations, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("cruise") || lowercaseMessage.includes("ship") || lowercaseMessage.includes("cabin")) {
                aiResponse = `Thank you for your interest in our cruise offerings! Our cruise specialists will be with you shortly to help you find the perfect voyage.\n\n⚡ For immediate assistance with cruise bookings, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("payment") || lowercaseMessage.includes("pay") || lowercaseMessage.includes("card")) {
                aiResponse = `Thank you for your inquiry about payment options. Our payment specialists will be with you shortly to assist with your transaction.\n\n⚡ For immediate assistance with payments, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else if (lowercaseMessage.includes("itinerary") || lowercaseMessage.includes("schedule") || lowercaseMessage.includes("plan")) {
                aiResponse = `Thank you for your inquiry about travel itineraries. Our travel planners will be with you shortly to help you plan your perfect trip.\n\n⚡ For immediate itinerary assistance, please contact us on WhatsApp: ${whatsAppLink}`;
              }
              else {
                aiResponse = `Thank you for your message. Our team is reviewing your inquiry and will respond shortly. We appreciate your patience.\n\n⚡ For immediate assistance, please contact us on WhatsApp: ${whatsAppLink}`;
              }
            }
            
            // Create an automatic response message from the system
            const aiMessageData = {
              conversationId: parseInt(conversationId),
              senderId: 0, // System/AI sender ID
              senderType: 'admin',
              content: aiResponse,
              messageType: 'text' as const,
              fileUrl: null,
            };
            
            const aiResponseMessage = await storage.createMessage(aiMessageData);
            
            // Mark the conversation as needing admin attention
            await storage.updateConversation(parseInt(conversationId), {
              status: 'open',
              readByAdmin: false // This is valid in the schema
            });
            
            // Emit the automated response to the client
            io.to(`conversation-${conversationId}`).emit('message-received', aiResponseMessage);
            
            console.log(`Sent automated response for conversation ${conversationId}`);
          } catch (error) {
            console.error("Error sending automated response:", error);
          }
        }, 2000); // 2-second delay to make it seem more natural
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Image upload route for Cloudinary integration
  app.post("/api/upload-image", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const { file, folder = "travelease" } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate the file is a data URL
      if (!file.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid file format. Only images are allowed." });
      }

      // Use imported functions from cloudinary.ts
      // We'll use dynamic import to avoid any circular dependencies
      const cloudinaryModule = await import("./cloudinary");
      const result = await cloudinaryModule.uploadImage(file, folder);
      res.json(result);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  });

  // Admin destinations CRUD endpoints
  app.post("/api/destinations/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const destination = await storage.createDestination(req.body);
      res.status(201).json(destination);
    } catch (error: any) {
      console.error("Error creating destination:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/destinations/admin/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const destination = await storage.updateDestination(id, req.body);
      
      if (!destination) {
        return res.status(404).json({ error: "Destination not found" });
      }
      
      res.json(destination);
    } catch (error: any) {
      console.error("Error updating destination:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/destinations/admin/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDestination(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting destination:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Image upload route is handled by the modular imageUploadRoutes import

  // Admin destinations CRUD operations
  // Routes moved to a separate file (server/routes/admin-destinations.ts)

  // Seed the database with initial data
  try {
    await seed();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // Register our custom routes
  app.use(imageUploadRoutes);
  app.use(adminDestinationsRoutes);
  app.use(adminCruisesRoutes);
  app.use(adminDriversRoutes);
  app.use(adminEventsRoutes);
  app.use(adminHotelsRoutes);
  app.use(adminPackagesRoutes);
  app.use(paymentDetailsRoutes);
  
  // Register direct database routes that bypass auth and storage
  app.use(directDatabaseRoutes);
  
  return httpServer;
}
