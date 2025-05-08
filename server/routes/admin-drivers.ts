import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertDriverSchema } from "@shared/schema";
import { deleteImage } from "../cloudinary";

const router = Router();

/**
 * @route GET /api/drivers/admin
 * @desc Get all drivers for admin
 * @access Private (Admin only)
 */
router.get("/api/drivers/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const drivers = await storage.getAllDrivers();
    res.json(drivers);
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: error.message || "Failed to fetch drivers" });
  }
});

/**
 * @route GET /api/drivers/admin/:id
 * @desc Get a driver by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/drivers/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }
    
    const driver = await storage.getDriver(id);
    
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    res.json(driver);
  } catch (error: any) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ error: error.message || "Failed to fetch driver" });
  }
});

/**
 * @route POST /api/drivers/admin
 * @desc Create a new driver
 * @access Private (Admin only)
 */
router.post("/api/drivers/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertDriverSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid driver data", 
        details: validationResult.error.errors 
      });
    }
    
    const driver = await storage.createDriver(validationResult.data);
    res.status(201).json(driver);
  } catch (error: any) {
    console.error("Error creating driver:", error);
    res.status(500).json({ error: error.message || "Failed to create driver" });
  }
});

/**
 * @route PUT /api/drivers/admin/:id
 * @desc Update a driver
 * @access Private (Admin only)
 */
router.put("/api/drivers/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertDriverSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid driver data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if driver exists
    const existingDriver = await storage.getDriver(id);
    
    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    // Update driver
    const updatedDriver = await storage.updateDriver(id, validationResult.data);
    
    res.json(updatedDriver);
  } catch (error: any) {
    console.error("Error updating driver:", error);
    res.status(500).json({ error: error.message || "Failed to update driver" });
  }
});

/**
 * @route DELETE /api/drivers/admin/:id
 * @desc Delete a driver
 * @access Private (Admin only)
 */
router.delete("/api/drivers/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }
    
    // Check if driver exists
    const driver = await storage.getDriver(id);
    
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (driver.imageUrl && driver.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = driver.imageUrl.split('/');
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
    
    // Delete driver
    await storage.deleteDriver(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ error: error.message || "Failed to delete driver" });
  }
});

export default router;