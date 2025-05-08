import { Router, Request, Response } from "express";
import { db } from "../db";
import { paymentDetails, bookings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../auth";

const router = Router();

// Get payment details for a specific booking
router.get("/api/payment-details/booking/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    
    const paymentDetail = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId))
      .limit(1);
    
    if (paymentDetail.length === 0) {
      return res.status(404).json({ error: "Payment details not found for this booking" });
    }
    
    res.json(paymentDetail[0]);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// Process payment for a booking
router.post("/api/payment-details/process/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const paymentData = req.body;
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    
    // Check if booking exists
    const bookingExists = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    if (bookingExists.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Here we would normally integrate with Stripe
    // But since we don't have Stripe keys yet, we'll create a mock payment processor response
    
    // Save payment details
    const result = await db.insert(paymentDetails).values({
      bookingId,
      cardName: paymentData.cardName,
      cardNumber: paymentData.cardNumber,
      cardExpiry: paymentData.cardExpiry,
      cardCvc: paymentData.cardCvc,
      address: paymentData.address,
      city: paymentData.city,
      state: paymentData.state,
      zipCode: paymentData.zipCode,
      country: paymentData.country || "USA",
      amount: bookingExists[0].totalPrice,
      paymentStatus: "error", // Set status to error
      errorMessage: "We are experiencing some issues with our payment processor at the moment. Please try again later or contact support for assistance.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Update booking status
    await db
      .update(bookings)
      .set({ 
        status: "pending",
        address: paymentData.address,
        city: paymentData.city,
        state: paymentData.state,
        zipCode: paymentData.zipCode,
        country: paymentData.country || "USA",
      })
      .where(eq(bookings.id, bookingId));
    
    res.status(201).json({
      success: false,
      paymentDetail: result[0],
      error: {
        message: "We are experiencing some issues with our payment processor at the moment. Please try again later or contact support for assistance.",
        code: "stripe_unavailable",
        needHelp: true
      }
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ 
      success: false, 
      error: {
        message: "We are experiencing some issues with our payment processor at the moment. Please try again later or contact support for assistance.",
        code: "payment_error",
        needHelp: true
      }
    });
  }
});

// Get all payment details (admin only)
router.get("/api/payment-details/admin", isAdmin, async (req: Request, res: Response) => {
  try {
    const allPaymentDetails = await db
      .select({
        payment: paymentDetails,
        booking: {
          id: bookings.id,
          userId: bookings.userId,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          travelDate: bookings.travelDate,
          bookingType: bookings.bookingType,
          itemId: bookings.itemId
        }
      })
      .from(paymentDetails)
      .leftJoin(bookings, eq(paymentDetails.bookingId, bookings.id))
      .orderBy(paymentDetails.createdAt);
    
    const formattedPaymentDetails = allPaymentDetails.map(item => ({
      ...item.payment,
      booking: item.booking
    }));
    
    res.json(formattedPaymentDetails);
  } catch (error) {
    console.error("Error fetching all payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// Update payment details (admin only)
router.patch("/api/payment-details/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }
    
    const updatedPaymentDetail = await db
      .update(paymentDetails)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(paymentDetails.id, paymentId))
      .returning();
    
    if (updatedPaymentDetail.length === 0) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    
    res.json(updatedPaymentDetail[0]);
  } catch (error) {
    console.error("Error updating payment details:", error);
    res.status(500).json({ error: "Failed to update payment details" });
  }
});

// Create payment details
router.post("/api/payment-details", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }
    
    // Check if payment details already exist for this booking
    const existingPaymentDetail = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId));
    
    if (existingPaymentDetail.length > 0) {
      return res.status(400).json({ error: "Payment details already exist for this booking" });
    }
    
    const newPaymentDetail = await db
      .insert(paymentDetails)
      .values({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentStatus: "pending"
      })
      .returning();
    
    res.status(201).json(newPaymentDetail[0]);
  } catch (error) {
    console.error("Error creating payment details:", error);
    res.status(500).json({ error: "Failed to create payment details" });
  }
});

export default router;