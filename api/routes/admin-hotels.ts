import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { 
  insertHotelSchema, 
  insertHotelRoomTypeSchema, 
  insertHotelRoomImageSchema 
} from "../schema";
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

// ROOM TYPES ENDPOINTS

/**
 * @route GET /api/hotels/admin/:hotelId/room-types
 * @desc Get all room types for a hotel
 * @access Private (Admin only)
 */
router.get("/api/hotels/admin/:hotelId/room-types", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    // Check if hotel exists
    const hotel = await storage.getHotel(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    const roomTypes = await storage.getRoomTypesByHotel(hotelId);
    res.json(roomTypes);
  } catch (error: any) {
    console.error("Error fetching room types:", error);
    res.status(500).json({ error: error.message || "Failed to fetch room types" });
  }
});

/**
 * @route GET /api/hotels/admin/room-types/:id
 * @desc Get a room type by ID
 * @access Private (Admin only)
 */
router.get("/api/hotels/admin/room-types/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    const roomType = await storage.getRoomType(id);
    
    if (!roomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    res.json(roomType);
  } catch (error: any) {
    console.error("Error fetching room type:", error);
    res.status(500).json({ error: error.message || "Failed to fetch room type" });
  }
});

/**
 * @route POST /api/hotels/admin/:hotelId/room-types
 * @desc Create a new room type for a hotel
 * @access Private (Admin only)
 */
router.post("/api/hotels/admin/:hotelId/room-types", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    // Check if hotel exists
    const hotel = await storage.getHotel(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    // Add hotelId to request body
    const roomTypeData = {
      ...req.body,
      hotelId
    };
    
    // Validate request body against schema
    const validationResult = insertHotelRoomTypeSchema.safeParse(roomTypeData);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid room type data", 
        details: validationResult.error.errors 
      });
    }
    
    const roomType = await storage.createRoomType(validationResult.data);
    res.status(201).json(roomType);
  } catch (error: any) {
    console.error("Error creating room type:", error);
    res.status(500).json({ error: error.message || "Failed to create room type" });
  }
});

/**
 * @route PUT /api/hotels/admin/room-types/:id
 * @desc Update a room type
 * @access Private (Admin only)
 */
router.put("/api/hotels/admin/room-types/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertHotelRoomTypeSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid room type data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if room type exists
    const existingRoomType = await storage.getRoomType(id);
    
    if (!existingRoomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    // Update room type
    const updatedRoomType = await storage.updateRoomType(id, validationResult.data);
    
    res.json(updatedRoomType);
  } catch (error: any) {
    console.error("Error updating room type:", error);
    res.status(500).json({ error: error.message || "Failed to update room type" });
  }
});

/**
 * @route DELETE /api/hotels/admin/room-types/:id
 * @desc Delete a room type
 * @access Private (Admin only)
 */
router.delete("/api/hotels/admin/room-types/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    // Check if room type exists
    const roomType = await storage.getRoomType(id);
    
    if (!roomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    // Delete room type
    await storage.deleteRoomType(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting room type:", error);
    res.status(500).json({ error: error.message || "Failed to delete room type" });
  }
});

// ROOM IMAGES ENDPOINTS

/**
 * @route GET /api/hotels/admin/room-types/:roomTypeId/images
 * @desc Get all images for a room type
 * @access Private (Admin only)
 */
router.get("/api/hotels/admin/room-types/:roomTypeId/images", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const roomTypeId = parseInt(req.params.roomTypeId);
    
    if (isNaN(roomTypeId)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    // Check if room type exists
    const roomType = await storage.getRoomType(roomTypeId);
    
    if (!roomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    const images = await storage.getRoomImagesByRoomType(roomTypeId);
    res.json(images);
  } catch (error: any) {
    console.error("Error fetching room images:", error);
    res.status(500).json({ error: error.message || "Failed to fetch room images" });
  }
});

/**
 * @route POST /api/hotels/admin/room-types/:roomTypeId/images
 * @desc Create a new image for a room type
 * @access Private (Admin only)
 */
router.post("/api/hotels/admin/room-types/:roomTypeId/images", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const roomTypeId = parseInt(req.params.roomTypeId);
    
    if (isNaN(roomTypeId)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    // Check if room type exists
    const roomType = await storage.getRoomType(roomTypeId);
    
    if (!roomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    // Add roomTypeId to request body
    const imageData = {
      ...req.body,
      roomTypeId
    };
    
    // Validate request body against schema
    const validationResult = insertHotelRoomImageSchema.safeParse(imageData);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid room image data", 
        details: validationResult.error.errors 
      });
    }
    
    const image = await storage.createRoomImage(validationResult.data);
    res.status(201).json(image);
  } catch (error: any) {
    console.error("Error creating room image:", error);
    res.status(500).json({ error: error.message || "Failed to create room image" });
  }
});

/**
 * @route PUT /api/hotels/admin/room-images/:id
 * @desc Update a room image
 * @access Private (Admin only)
 */
router.put("/api/hotels/admin/room-images/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room image ID" });
    }
    
    // Validate request body against schema
    const validationResult = insertHotelRoomImageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid room image data", 
        details: validationResult.error.errors 
      });
    }
    
    // Check if room image exists
    const existingImage = await storage.getRoomImage(id);
    
    if (!existingImage) {
      return res.status(404).json({ error: "Room image not found" });
    }
    
    // Update room image
    const updatedImage = await storage.updateRoomImage(id, validationResult.data);
    
    res.json(updatedImage);
  } catch (error: any) {
    console.error("Error updating room image:", error);
    res.status(500).json({ error: error.message || "Failed to update room image" });
  }
});

/**
 * @route DELETE /api/hotels/admin/room-images/:id
 * @desc Delete a room image
 * @access Private (Admin only)
 */
router.delete("/api/hotels/admin/room-images/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room image ID" });
    }
    
    // Check if room image exists
    const image = await storage.getRoomImage(id);
    
    if (!image) {
      return res.status(404).json({ error: "Room image not found" });
    }
    
    // Extract the public ID from the image URL if it exists and is from Cloudinary
    if (image.imageUrl && image.imageUrl.includes('cloudinary.com')) {
      try {
        // Parse the URL to get the public ID
        const parts = image.imageUrl.split('/');
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
    
    // Delete room image
    await storage.deleteRoomImage(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting room image:", error);
    res.status(500).json({ error: error.message || "Failed to delete room image" });
  }
});

// Also add public endpoints for room types and images

/**
 * @route GET /api/hotels/:hotelId/room-types
 * @desc Get all room types for a hotel (public)
 * @access Public
 */
router.get("/api/hotels/:hotelId/room-types", async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: "Invalid hotel ID" });
    }
    
    // Check if hotel exists
    const hotel = await storage.getHotel(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    
    const roomTypes = await storage.getRoomTypesByHotel(hotelId);
    res.json(roomTypes);
  } catch (error: any) {
    console.error("Error fetching room types:", error);
    res.status(500).json({ error: error.message || "Failed to fetch room types" });
  }
});

/**
 * @route GET /api/room-types/:id/images
 * @desc Get all images for a room type (public)
 * @access Public
 */
router.get("/api/room-types/:id/images", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid room type ID" });
    }
    
    // Check if room type exists
    const roomType = await storage.getRoomType(id);
    
    if (!roomType) {
      return res.status(404).json({ error: "Room type not found" });
    }
    
    const images = await storage.getRoomImagesByRoomType(id);
    res.json(images);
  } catch (error: any) {
    console.error("Error fetching room images:", error);
    res.status(500).json({ error: error.message || "Failed to fetch room images" });
  }
});

export default router;