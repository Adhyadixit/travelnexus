import type { Express } from "express";
import { createServer, type Server } from "http";
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
  hotelRoomTypes, hotelRoomImages, insertDestinationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      const featured = req.query.featured === "true";
      let destinationsData;
      
      if (req.query.featured) {
        destinationsData = await storage.getFeaturedDestinations();
      } else {
        destinationsData = await storage.getAllDestinations();
      }
      
      res.json(destinationsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destinations" });
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
      const reviewData = {
        ...req.body,
        userId: req.user!.id,
        status: "approved", // Auto-approve for now
        helpfulVotes: 0,
        verified: req.body.dateOfStay ? true : false,
      };
      
      // Insert the review into the database
      const [newReview] = await db
        .insert(reviews)
        .values(reviewData)
        .returning();
      
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
      res.status(500).json({ error: "Failed to create review" });
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
      const hotel = await storage.updateHotel(parseInt(req.params.id), req.body);
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
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
          console.log("Creating new guest user for inquiry");
          const guestUser = await storage.createGuestUser({
            firstName: req.body.guestName.split(' ')[0] || req.body.guestName,
            lastName: req.body.guestName.split(' ').slice(1).join(' ') || '-',
            email: req.body.guestEmail,
            phoneNumber: req.body.guestPhone || '',
            sessionId: req.sessionID,
          });
          guestUserId = guestUser.id;
          console.log(`Created guest user with ID: ${guestUserId}`);
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
        
        await storage.createMessage(messageData);
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
  
  // Get conversations for the current user
  app.get("/api/user-conversations", async (req, res) => {
    try {
      let conversationsData = [];
      
      if (req.isAuthenticated()) {
        // Get authenticated user's conversations
        conversationsData = await storage.getConversationsByUser(req.user!.id);
      } else {
        // For guest users, check the session ID
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (guestUser) {
          conversationsData = await storage.getConversationsByGuestUser(guestUser.id);
        }
      }
      
      res.json(conversationsData);
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get guest user conversations by session
  app.get("/api/guest-conversations", async (req, res) => {
    try {
      let conversationsData = [];
      
      // Get guest user by session ID
      const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
      if (guestUser) {
        conversationsData = await storage.getConversationsByGuestUser(guestUser.id);
      }
      
      res.json(conversationsData);
    } catch (error) {
      console.error("Error fetching guest conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get messages for a conversation
  app.get("/api/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.query.conversationId as string);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check authorization
      let authorized = false;
      
      if (req.isAuthenticated()) {
        if (req.user!.role === 'admin') {
          authorized = true;
        } else if (conversation.userId === req.user!.id) {
          authorized = true;
        }
      } else if (conversation.guestUserId) {
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (guestUser && guestUser.id === conversation.guestUserId) {
          authorized = true;
        }
      }
      
      if (!authorized) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const { conversationId, message } = req.body;
      
      if (!conversationId || !message) {
        return res.status(400).json({ error: "Conversation ID and message are required" });
      }
      
      const conversation = await storage.getConversation(parseInt(conversationId));
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check authorization
      let authorized = false;
      let senderId = 0;
      let senderType = '';
      
      if (req.isAuthenticated()) {
        senderId = req.user!.id;
        senderType = req.user!.role === 'admin' ? 'admin' : 'user';
        
        if (req.user!.role === 'admin') {
          authorized = true;
        } else if (conversation.userId === req.user!.id) {
          authorized = true;
        }
      } else if (conversation.guestUserId) {
        const guestUser = await storage.getGuestUserBySessionId(req.sessionID);
        if (guestUser && guestUser.id === conversation.guestUserId) {
          senderId = guestUser.id;
          senderType = 'guest';
          authorized = true;
        }
      }
      
      if (!authorized) {
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
      
      const newMessage = await storage.createMessage(messageData);
      
      // Update conversation's last message time
      await storage.updateConversation(parseInt(conversationId), {
        lastMessageAt: new Date(),
        // Update read status based on sender
        readByAdmin: senderType === 'admin',
        readByUser: senderType === 'user' || senderType === 'guest',
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
