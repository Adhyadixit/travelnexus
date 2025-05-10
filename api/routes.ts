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
} from "./schema";

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
    } catch (error: unknown) {
      console.error("[API] Error in destinations route:", error);
      // Return details of the error for debugging
      return res.status(500).json({ 
        error: "Failed to fetch destinations", 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch cruise" });
    }
  });

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
