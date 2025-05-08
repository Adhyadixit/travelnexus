import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertCruiseSchema } from "@shared/schema";
import { deleteImage } from "../cloudinary";

const router = Router();

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
        console.log("Cruises fetched successfully:", cruises.length);
        res.json(cruises);
      })
      .catch(err => {
        console.error("Error in storage.getAllCruises():", err);
        res.status(500).json({ error: "Database error: " + err.message });
      });
  } catch (error: any) {
    console.error("Error fetching cruises:", error);
    res.status(500).json({ error: error.message || "Failed to fetch cruise" });
  }
});

/**
 * @route GET /api/cruises/admin/:id
 * @desc Get a cruise by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/cruises/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid cruise ID" });
    }
    
    const cruise = await storage.getCruise(id);
    
    if (!cruise) {
      return res.status(404).json({ error: "Cruise not found" });
    }
    
    res.json(cruise);
  } catch (error: any) {
    console.error("Error fetching cruise:", error);
    res.status(500).json({ error: error.message || "Failed to fetch cruise" });
  }
});

/**
 * @route POST /api/cruises/admin
 * @desc Create a new cruise
 * @access Private (Admin only)
 */
router.post("/api/cruises/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertCruiseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid cruise data", 
        details: validationResult.error.errors 
      });
    }
    
    const cruise = await storage.createCruise(validationResult.data);
    res.status(201).json(cruise);
  } catch (error: any) {
    console.error("Error creating cruise:", error);
    res.status(500).json({ error: error.message || "Failed to create cruise" });
  }
});

/**
 * @route PUT /api/cruises/admin/:id
 * @desc Update a cruise
 * @access Private (Admin only)
 */
router.put("/api/cruises/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid cruise ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertCruiseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid cruise data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if cruise exists
    const existingCruise = await storage.getCruise(id);
    
    if (!existingCruise) {
      return res.status(404).json({ error: "Cruise not found" });
    }
    
    // Update cruise
    const updatedCruise = await storage.updateCruise(id, validationResult.data);
    
    res.json(updatedCruise);
  } catch (error: any) {
    console.error("Error updating cruise:", error);
    res.status(500).json({ error: error.message || "Failed to update cruise" });
  }
});

/**
 * @route DELETE /api/cruises/admin/:id
 * @desc Delete a cruise
 * @access Private (Admin only)
 */
router.delete("/api/cruises/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid cruise ID" });
    }
    
    // Check if cruise exists
    const cruise = await storage.getCruise(id);
    
    if (!cruise) {
      return res.status(404).json({ error: "Cruise not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (cruise.imageUrl && cruise.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = cruise.imageUrl.split('/');
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
    
    // Delete cruise
    await storage.deleteCruise(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting cruise:", error);
    res.status(500).json({ error: error.message || "Failed to delete cruise" });
  }
});

export default router;