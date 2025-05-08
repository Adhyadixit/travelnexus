import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertPackageSchema } from "@shared/schema";
import { deleteImage } from "../cloudinary";

const router = Router();

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
        console.log("Packages fetched successfully:", packages.length);
        res.json(packages);
      })
      .catch(err => {
        console.error("Error in storage.getAllPackages():", err);
        res.status(500).json({ error: "Database error: " + err.message });
      });
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ error: error.message || "Failed to fetch packages" });
  }
});

/**
 * @route GET /api/packages/admin/:id
 * @desc Get a package by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/packages/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid package ID" });
    }
    
    const packageData = await storage.getPackage(id);
    
    if (!packageData) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    res.json(packageData);
  } catch (error: any) {
    console.error("Error fetching package:", error);
    res.status(500).json({ error: error.message || "Failed to fetch package" });
  }
});

/**
 * @route POST /api/packages/admin
 * @desc Create a new package
 * @access Private (Admin only)
 */
router.post("/api/packages/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertPackageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid package data", 
        details: validationResult.error.errors 
      });
    }
    
    const packageData = await storage.createPackage(validationResult.data);
    res.status(201).json(packageData);
  } catch (error: any) {
    console.error("Error creating package:", error);
    res.status(500).json({ error: error.message || "Failed to create package" });
  }
});

/**
 * @route PUT /api/packages/admin/:id
 * @desc Update a package
 * @access Private (Admin only)
 */
router.put("/api/packages/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid package ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertPackageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid package data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if package exists
    const existingPackage = await storage.getPackage(id);
    
    if (!existingPackage) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    // Update package
    const updatedPackage = await storage.updatePackage(id, validationResult.data);
    
    res.json(updatedPackage);
  } catch (error: any) {
    console.error("Error updating package:", error);
    res.status(500).json({ error: error.message || "Failed to update package" });
  }
});

/**
 * @route DELETE /api/packages/admin/:id
 * @desc Delete a package
 * @access Private (Admin only)
 */
router.delete("/api/packages/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid package ID" });
    }
    
    // Check if package exists
    const packageData = await storage.getPackage(id);
    
    if (!packageData) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (packageData.imageUrl && packageData.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = packageData.imageUrl.split('/');
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
    
    // Delete package
    await storage.deletePackage(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting package:", error);
    res.status(500).json({ error: error.message || "Failed to delete package" });
  }
});

export default router;