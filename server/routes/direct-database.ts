import { Router } from "express";
import { db } from "../db";
import { destinations, hotels, packages, cruises, drivers, events } from "@shared/schema";

const router = Router();

// Direct database access routes without auth checks or storage layer
router.get("/api/direct/destinations", async (req, res) => {
  try {
    console.log("Direct database access for destinations");
    const results = await db.select().from(destinations);
    console.log(`Successfully fetched ${results.length} destinations directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/direct/hotels", async (req, res) => {
  try {
    console.log("Direct database access for hotels");
    const results = await db.select().from(hotels);
    console.log(`Successfully fetched ${results.length} hotels directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/direct/packages", async (req, res) => {
  try {
    console.log("Direct database access for packages");
    const results = await db.select().from(packages);
    console.log(`Successfully fetched ${results.length} packages directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/direct/cruises", async (req, res) => {
  try {
    console.log("Direct database access for cruises");
    const results = await db.select().from(cruises);
    console.log(`Successfully fetched ${results.length} cruises directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/direct/drivers", async (req, res) => {
  try {
    console.log("Direct database access for drivers");
    const results = await db.select().from(drivers);
    console.log(`Successfully fetched ${results.length} drivers directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/direct/events", async (req, res) => {
  try {
    console.log("Direct database access for events");
    const results = await db.select().from(events);
    console.log(`Successfully fetched ${results.length} events directly from DB`);
    res.json(results);
  } catch (error: any) {
    console.error("Direct DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;