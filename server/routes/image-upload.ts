import { Router } from "express";
import { uploadImage } from "../cloudinary";
import { isAuthenticated, isAdmin } from "../auth";

const router = Router();

/**
 * @route POST /api/upload-image
 * @desc Upload an image to Cloudinary
 * @access Private (Admin only)
 */
router.post("/api/upload-image", async (req, res) => {
  try {
    const { file, folder } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
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