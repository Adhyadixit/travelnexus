import { Router } from "express";
import { storage } from "../storage";
import { insertDestinationSchema } from "@shared/schema";

const router = Router();
const isAdmin = (global as any).isAdmin;

// Get all destinations (admin only)
router.get("/api/destinations/admin", isAdmin, async (req, res) => {
  try {
    const destinations = await storage.getAllDestinations();
    res.json(destinations);
  } catch (error: any) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new destination (admin only)
router.post("/api/destinations/admin", isAdmin, async (req, res) => {
  try {
    const validated = insertDestinationSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.message });
    }

    const destination = await storage.createDestination(validated.data);
    res.status(201).json(destination);
  } catch (error: any) {
    console.error("Error creating destination:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a destination (admin only)
router.put("/api/destinations/admin/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertDestinationSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.message });
    }

    const destination = await storage.updateDestination(id, validated.data);
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    res.json(destination);
  } catch (error: any) {
    console.error("Error updating destination:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a destination (admin only)
router.delete("/api/destinations/admin/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteDestination(id);
    if (!deleted) {
      return res.status(404).json({ error: "Destination not found" });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting destination:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;