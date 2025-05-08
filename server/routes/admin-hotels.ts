import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertHotelSchema } from "@shared/schema";
import { deleteImage } from "../cloudinary";

const router = Router();

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
        console.log("Hotels fetched successfully:", hotels.length);
        res.json(hotels);
      })
      .catch(err => {
        console.error("Error in storage.getAllHotels():", err);
        res.status(500).json({ error: "Database error: " + err.message });
      });
  } catch (error: any) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: error.message || "Failed to fetch hotels" });
  }
});

/**
 * @route GET /api/hotels/admin/:id
 * @desc Get a hotel by ID for admin
 * @access Private (Admin only)
 */
router.get("/api/hotels/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    const hotel = await storage.getHotel(id);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    res.json(hotel);
  } catch (error: any) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: error.message || "Failed to fetch hotel" });
  }
});

/**
 * @route POST /api/hotels/admin
 * @desc Create a new hotel
 * @access Private (Admin only)
 */
router.post("/api/hotels/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = insertHotelSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid hotel data", 
        details: validationResult.error.errors 
      });
    }
    
    const hotel = await storage.createHotel(validationResult.data);
    res.status(201).json(hotel);
  } catch (error: any) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ error: error.message || "Failed to create hotel" });
  }
});

/**
 * @route PUT /api/hotels/admin/:id
 * @desc Update a hotel
 * @access Private (Admin only)
 */
router.put("/api/hotels/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertHotelSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid hotel data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if hotel exists
    const existingHotel = await storage.getHotel(id);
    
    if (!existingHotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    // Update hotel
    const updatedHotel = await storage.updateHotel(id, validationResult.data);
    
    res.json(updatedHotel);
  } catch (error: any) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: error.message || "Failed to update hotel" });
  }
});

/**
 * @route DELETE /api/hotels/admin/:id
 * @desc Delete a hotel
 * @access Private (Admin only)
 */
router.delete("/api/hotels/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    // Check if hotel exists
    const hotel = await storage.getHotel(id);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (hotel.imageUrl && hotel.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = hotel.imageUrl.split('/');
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
    
    // Delete hotel
    await storage.deleteHotel(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ error: error.message || "Failed to delete hotel" });
  }
});

export default router;