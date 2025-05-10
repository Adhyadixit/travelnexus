import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertDestinationSchema, destinations } from "../schema";
import { deleteImage } from "../cloudinary";
import { db } from "../db";

const router = Router();

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
    try {
      const results = await db.select().from(destinations);
      console.log("DIRECT DB QUERY SUCCESS:", results.length);
      res.json(results);
    } catch (dbErr: any) {
      console.error("DIRECT DB QUERY ERROR:", dbErr);
      res.status(500).json({ error: "Direct DB Error: " + dbErr.message });
    }
  } catch (error: any) {
    console.error("Error in route handler:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: error.message || "Failed to fetch destinations" });
  }
});

/**
 * @route GET /api/destinations/admin/:id
 * @desc Get a destination by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/destinations/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid destination ID" });
    }
    
    const destination = await storage.getDestination(id);
    
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    
    res.json(destination);
  } catch (error: any) {
    console.error("Error fetching destination:", error);
    res.status(500).json({ error: error.message || "Failed to fetch destination" });
  }
});

/**
 * @route POST /api/destinations/admin
 * @desc Create a new destination
 * @access Private (Admin only)
 */
router.post("/api/destinations/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertDestinationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid destination data", 
        details: validationResult.error.errors 
      });
    }
    
    const destination = await storage.createDestination(validationResult.data);
    res.status(201).json(destination);
  } catch (error: any) {
    console.error("Error creating destination:", error);
    res.status(500).json({ error: error.message || "Failed to create destination" });
  }
});

/**
 * @route PUT /api/destinations/admin/:id
 * @desc Update a destination
 * @access Private (Admin only)
 */
router.put("/api/destinations/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid destination ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertDestinationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid destination data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if destination exists
    const existingDestination = await storage.getDestination(id);
    
    if (!existingDestination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    
    // Update destination
    const updatedDestination = await storage.updateDestination(id, validationResult.data);
    
    res.json(updatedDestination);
  } catch (error: any) {
    console.error("Error updating destination:", error);
    res.status(500).json({ error: error.message || "Failed to update destination" });
  }
});

/**
 * @route DELETE /api/destinations/admin/:id
 * @desc Delete a destination
 * @access Private (Admin only)
 */
router.delete("/api/destinations/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid destination ID" });
    }
    
    // Check if destination exists
    const destination = await storage.getDestination(id);
    
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (destination.imageUrl && destination.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = destination.imageUrl.split('/');
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
    
    // Delete destination
    await storage.deleteDestination(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting destination:", error);
    res.status(500).json({ error: error.message || "Failed to delete destination" });
  }
});

export default router;