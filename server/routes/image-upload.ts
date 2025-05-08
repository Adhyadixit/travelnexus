import { Router } from "express";
import { uploadImage } from "../cloudinary";
import { isAuthenticated } from "../auth";

const router = Router();

// Upload an image to Cloudinary
router.post("/api/upload-image", isAuthenticated, async (req, res) => {
  try {
    const { file, folder = "travelease" } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Validate the file is a data URL
    if (!file.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid file format. Only images are allowed." });
    }

    const result = await uploadImage(file, folder);
    res.json(result);
  } catch (error: any) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

export default router;