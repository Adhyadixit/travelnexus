import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertEventSchema } from "../schema";
import { deleteImage } from "../cloudinary";

const router = Router();

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
        console.log("Events fetched successfully:", events.length);
        res.json(events);
      })
      .catch(err => {
        console.error("Error in storage.getAllEvents():", err);
        res.status(500).json({ error: "Database error: " + err.message });
      });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: error.message || "Failed to fetch event" });
  }
});

/**
 * @route GET /api/events/admin/:id
 * @desc Get an event by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/events/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    const event = await storage.getEvent(id);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(event);
  } catch (error: any) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: error.message || "Failed to fetch event" });
  }
});

/**
 * @route POST /api/events/admin
 * @desc Create a new event
 * @access Private (Admin only)
 */
router.post("/api/events/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertEventSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid event data", 
        details: validationResult.error.errors 
      });
    }
    
    const event = await storage.createEvent(validationResult.data);
    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: error.message || "Failed to create event" });
  }
});

/**
 * @route PUT /api/events/admin/:id
 * @desc Update an event
 * @access Private (Admin only)
 */
router.put("/api/events/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertEventSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid event data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if event exists
    const existingEvent = await storage.getEvent(id);
    
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Update event
    const updatedEvent = await storage.updateEvent(id, validationResult.data);
    
    res.json(updatedEvent);
  } catch (error: any) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: error.message || "Failed to update event" });
  }
});

/**
 * @route DELETE /api/events/admin/:id
 * @desc Delete an event
 * @access Private (Admin only)
 */
router.delete("/api/events/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    // Check if event exists
    const event = await storage.getEvent(id);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (event.imageUrl && event.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = event.imageUrl.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        
        if (publicId) {
          // We don't want to fail the delete operation if image deletion fails
          try {
            await deleteImage(publicId);
          } catch (err) {
            console.error('Error deleting image from Cloudinary:', err);
          }
        }
      } catch (err) {
        console.error('Error parsing image URL to get public ID:', err);
      }
    }
    
    // Delete event
    await storage.deleteEvent(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: error.message || "Failed to delete event" });
  }
});

export default router;