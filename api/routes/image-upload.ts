import { Router } from "express";
import { uploadImage } from "../cloudinary";
import { isAuthenticated, isAdmin } from "../auth";

const router = Router();

/**
 * @route POST /api/upload-image
 * @desc Upload an image to Cloudinary
 * @access Public
 */
router.post("/api/upload-image", async (req, res) => {
  try {
    const { file, folder } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    // Validate the file (data URI)
    if (!file.startsWith('data:image/')) {
      return res.status(400).json({ error: "Invalid file format. Only images are allowed." });
    }
    
    // Check if the file size is reasonable (roughly)
    // Data URIs are about 33% larger than the actual file
    const approximateSize = (file.length * 3) / 4 / 1024 / 1024; // Convert to MB
    if (approximateSize > 7) { // Allow slightly more than 5MB to account for encoding overhead
      return res.status(400).json({ error: "File size too large. Maximum is 5MB." });
    }
    
    // Upload to Cloudinary
    const result = await uploadImage(file, folder);
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

export default router;