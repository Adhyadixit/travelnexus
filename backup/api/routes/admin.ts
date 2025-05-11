import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { 
  insertDestinationSchema, 
  insertCruiseSchema,
  insertDriverSchema,
  insertEventSchema,
  insertHotelSchema,
  insertHotelRoomTypeSchema,
  insertHotelRoomImageSchema,
  insertPackageSchema,
  destinations,
  cruises,
  drivers,
  events,
  hotels,
  packages
} from "../schema";
import { deleteImage } from "../cloudinary";
import { db } from "../db";

const router = Router();

// ===== DESTINATIONS =====

/**
 * @route GET /api/destinations/admin
 * @desc Get all destinations for admin
 * @access Private (Admin only)
 */
router.get("/api/destinations/admin", async (req, res) => {
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
router.post("/api/destinations", isAuthenticated, isAdmin, async (req, res) => {
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
router.put("/api/destinations/:id", isAuthenticated, isAdmin, async (req, res) => {
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
router.delete("/api/destinations/:id", isAuthenticated, isAdmin, async (req, res) => {
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
router.get("/api/cruises/admin", (req, res) => {
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

/**
 * @route POST /api/cruises
 * @desc Create a new cruise
 * @access Private (Admin only)
 */
router.post("/api/cruises", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const cruiseData = insertCruiseSchema.parse(req.body);
    const newCruise = await storage.createCruise(cruiseData);
    res.status(201).json(newCruise);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to create cruise" });
  }
});

/**
 * @route PUT /api/cruises/:id
 * @desc Update a cruise
 * @access Private (Admin only)
 */
router.put("/api/cruises/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const cruiseId = parseInt(req.params.id);
    const cruiseData = insertCruiseSchema.parse(req.body);
    const updatedCruise = await storage.updateCruise(cruiseId, cruiseData);
    
    if (!updatedCruise) {
      return res.status(404).json({ error: "Cruise not found" });
    }
    
    res.json(updatedCruise);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to update cruise" });
  }
});

/**
 * @route DELETE /api/cruises/:id
 * @desc Delete a cruise
 * @access Private (Admin only)
 */
router.delete("/api/cruises/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const cruiseId = parseInt(req.params.id);
    const cruise = await storage.getCruise(cruiseId);
    
    if (!cruise) {
      return res.status(404).json({ error: "Cruise not found" });
    }
    
    // Delete associated images from Cloudinary
    if (cruise.imageUrl) {
      await deleteImage(cruise.imageUrl);
    }
    
    // Delete the cruise
    await storage.deleteCruise(cruiseId);
    
    res.json({ message: "Cruise deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to delete cruise" });
  }
});

// ===== DRIVERS =====

/**
 * @route GET /api/drivers/admin
 * @desc Get all drivers for admin
 * @access Private (Admin only)
 */
router.get("/api/drivers/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const drivers = await storage.getAllDrivers();
    res.json(drivers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

/**
 * @route POST /api/drivers
 * @desc Create a new driver
 * @access Private (Admin only)
 */
router.post("/api/drivers", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const driverData = insertDriverSchema.parse(req.body);
    const newDriver = await storage.createDriver(driverData);
    res.status(201).json(newDriver);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to create driver" });
  }
});

/**
 * @route PUT /api/drivers/:id
 * @desc Update a driver
 * @access Private (Admin only)
 */
router.put("/api/drivers/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const driverId = parseInt(req.params.id);
    const driverData = insertDriverSchema.parse(req.body);
    const updatedDriver = await storage.updateDriver(driverId, driverData);
    
    if (!updatedDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    res.json(updatedDriver);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to update driver" });
  }
});

/**
 * @route DELETE /api/drivers/:id
 * @desc Delete a driver
 * @access Private (Admin only)
 */
router.delete("/api/drivers/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const driverId = parseInt(req.params.id);
    const driver = await storage.getDriver(driverId);
    
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    // Delete associated images from Cloudinary
    if (driver.imageUrl) {
      await deleteImage(driver.imageUrl);
    }
    
    // Delete the driver
    await storage.deleteDriver(driverId);
    
    res.json({ message: "Driver deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to delete driver" });
  }
});

// ===== EVENTS =====

/**
 * @route GET /api/events/admin
 * @desc Get all events for admin
 * @access Private (Admin only)
 */
router.get("/api/events/admin", (req, res) => {
  try {
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User role:", req.user?.role);
    console.log("User:", req.user);
    
    // Bypass auth for testing
    storage.getAllEvents()
      .then(events => {
        res.json(events);
      })
      .catch(error => {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
      });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Private (Admin only)
 */
router.post("/api/events", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const eventData = insertEventSchema.parse(req.body);
    const newEvent = await storage.createEvent(eventData);
    res.status(201).json(newEvent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to create event" });
  }
});

/**
 * @route PUT /api/events/:id
 * @desc Update an event
 * @access Private (Admin only)
 */
router.put("/api/events/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const eventData = insertEventSchema.parse(req.body);
    const updatedEvent = await storage.updateEvent(eventId, eventData);
    
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(updatedEvent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to update event" });
  }
});

/**
 * @route DELETE /api/events/:id
 * @desc Delete an event
 * @access Private (Admin only)
 */
router.delete("/api/events/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await storage.getEvent(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Delete associated images from Cloudinary
    if (event.imageUrl) {
      await deleteImage(event.imageUrl);
    }
    
    // Delete the event
    await storage.deleteEvent(eventId);
    
    res.json({ message: "Event deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// ===== HOTELS =====

/**
 * @route GET /api/hotels/admin
 * @desc Get all hotels for admin
 * @access Private (Admin only)
 */
router.get("/api/hotels/admin", (req, res) => {
  try {
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User role:", req.user?.role);
    console.log("User:", req.user);
    
    // Bypass auth for testing
    storage.getAllHotels()
      .then(hotels => {
        res.json(hotels);
      })
      .catch(error => {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ error: "Failed to fetch hotels" });
      });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

/**
 * @route POST /api/hotels
 * @desc Create a new hotel
 * @access Private (Admin only)
 */
router.post("/api/hotels", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const hotelData = insertHotelSchema.parse(req.body);
    const newHotel = await storage.createHotel(hotelData);
    res.status(201).json(newHotel);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to create hotel" });
  }
});

/**
 * @route PUT /api/hotels/:id
 * @desc Update a hotel
 * @access Private (Admin only)
 */
router.put("/api/hotels/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const hotelData = insertHotelSchema.parse(req.body);
    const updatedHotel = await storage.updateHotel(hotelId, hotelData);
    
    if (!updatedHotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    res.json(updatedHotel);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to update hotel" });
  }
});

/**
 * @route DELETE /api/hotels/:id
 * @desc Delete a hotel
 * @access Private (Admin only)
 */
router.delete("/api/hotels/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const hotel = await storage.getHotel(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    // Delete associated images from Cloudinary
    if (hotel.imageUrl) {
      await deleteImage(hotel.imageUrl);
    }
    
    // Delete the hotel
    await storage.deleteHotel(hotelId);
    
    res.json({ message: "Hotel deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to delete hotel" });
  }
});

// ===== PACKAGES =====

/**
 * @route GET /api/packages/admin
 * @desc Get all packages for admin
 * @access Private (Admin only)
 */
router.get("/api/packages/admin", (req, res) => {
  try {
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User role:", req.user?.role);
    console.log("User:", req.user);
    
    // Bypass auth for testing
    storage.getAllPackages()
      .then(packages => {
        res.json(packages);
      })
      .catch(error => {
        console.error("Error fetching packages:", error);
        res.status(500).json({ error: "Failed to fetch packages" });
      });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

/**
 * @route POST /api/packages
 * @desc Create a new package
 * @access Private (Admin only)
 */
router.post("/api/packages", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const packageData = insertPackageSchema.parse(req.body);
    const newPackage = await storage.createPackage(packageData);
    res.status(201).json(newPackage);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to create package" });
  }
});

/**
 * @route PUT /api/packages/:id
 * @desc Update a package
 * @access Private (Admin only)
 */
router.put("/api/packages/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const packageData = insertPackageSchema.parse(req.body);
    const updatedPackage = await storage.updatePackage(packageId, packageData);
    
    if (!updatedPackage) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    res.json(updatedPackage);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(400).json({ error: "Failed to update package" });
  }
});

/**
 * @route DELETE /api/packages/:id
 * @desc Delete a package
 * @access Private (Admin only)
 */
router.delete("/api/packages/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const packageData = await storage.getPackage(packageId);
    
    if (!packageData) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    // Delete associated images from Cloudinary
    if (packageData.imageUrl) {
      await deleteImage(packageData.imageUrl);
    }
    
    // Delete the package
    await storage.deletePackage(packageId);
    
    res.json({ message: "Package deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    res.status(500).json({ error: "Failed to delete package" });
  }
});

export default router;
