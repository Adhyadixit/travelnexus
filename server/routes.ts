import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { seed } from "./seed";
import {
  eq, and, gte, lte, desc, asc, like,
} from "drizzle-orm";
import {
  bookings, bookingTypeEnum,
  destinations, packages, hotels, drivers, cruises, events, users, reviews,
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

  app.get("/api/drivers/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allDrivers = await storage.getAllDrivers();
      res.json(allDrivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/cruises/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allCruises = await storage.getAllCruises();
      res.json(allCruises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });

  app.get("/api/events/admin", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const allEvents = await storage.getAllEvents();
      res.json(allEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

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

  // Seed the database with initial data
  try {
    await seed();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
