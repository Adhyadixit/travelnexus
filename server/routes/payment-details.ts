import { Request, Response, Router } from "express";
import { db } from "../db";
import { 
  bookings, 
  paymentDetails,
  insertPaymentDetailsSchema,
  InsertPaymentDetail
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../auth";
import { z } from "zod";

const router = Router();

// Create payment details for a booking
router.post("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    
    // First check if the booking exists and belongs to the user
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify user owns this booking or is admin
    if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Validate payment details
    try {
      const validPaymentData = insertPaymentDetailsSchema.parse(req.body);
      
      // Modify the credit card number to only store the last 4 digits for security
      const cardNumber = validPaymentData.cardNumber;
      const maskedCardNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
      
      // Create the payment details
      const [newPaymentDetails] = await db
        .insert(paymentDetails)
        .values({
          ...validPaymentData,
          cardNumber: maskedCardNumber,
          // We should clear the CVC immediately after processing
          cardCVC: null,
        })
        .returning();
      
      // Update the booking payment status
      await db
        .update(bookings)
        .set({
          paymentStatus: "pending",
          transactionId: newPaymentDetails.transactionId || `TR-${booking.id}-${Date.now().toString().slice(-6)}`,
        })
        .where(eq(bookings.id, bookingId));
      
      res.status(201).json(newPaymentDetails);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payment data", details: validationError.errors });
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating payment details:", error);
    res.status(500).json({ error: "Failed to create payment details" });
  }
});

// Get payment details for a booking - for the user who owns the booking
router.get("/booking/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    // First check if the booking exists and belongs to the user
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify user owns this booking or is admin
    if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get payment details
    const paymentData = await db.query.paymentDetails.findFirst({
      where: eq(paymentDetails.bookingId, bookingId),
    });
    
    if (!paymentData) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    
    // Never return the CVC even if it somehow got stored
    const { cardCVC, ...safePaymentData } = paymentData;
    
    res.json(safePaymentData);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// Process payment (simulate payment processing)
router.post("/process/:bookingId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    // First check if the booking exists and belongs to the user
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify user owns this booking or is admin
    if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get payment details
    const paymentData = await db.query.paymentDetails.findFirst({
      where: eq(paymentDetails.bookingId, bookingId),
    });
    
    if (!paymentData) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    
    // Simulate payment processing (in a real system, this would integrate with Stripe or another provider)
    // For this demo, we'll simulate a payment error to demonstrate the error handling flow
    const paymentResult = {
      success: false,
      error: "Payment declined by issuing bank. Please try another payment method or contact your bank.",
    };
    
    if (paymentResult.success) {
      // Update payment status to success
      await db
        .update(paymentDetails)
        .set({
          paymentStatus: "success",
          errorMessage: null,
          transactionId: `TR-${Date.now().toString().slice(-10)}`,
        })
        .where(eq(paymentDetails.bookingId, bookingId));
      
      // Update booking status
      await db
        .update(bookings)
        .set({
          status: "confirmed",
          paymentStatus: "paid",
        })
        .where(eq(bookings.id, bookingId));
      
      res.json({ success: true, message: "Payment processed successfully" });
    } else {
      // Update payment status to failed
      await db
        .update(paymentDetails)
        .set({
          paymentStatus: "failed",
          errorMessage: paymentResult.error,
        })
        .where(eq(paymentDetails.bookingId, bookingId));
      
      // Don't update booking status - keep it as pending
      res.status(400).json({ 
        success: false, 
        error: paymentResult.error,
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// Admin routes
// Get all payment details (admin only)
router.get("/admin", isAdmin, async (req: Request, res: Response) => {
  try {
    const allPayments = await db.query.paymentDetails.findMany({
      orderBy: (paymentDetails, { desc }) => [desc(paymentDetails.createdAt)],
    });
    
    // Never return CVCs
    const safePaymentsData = allPayments.map(({ cardCVC, ...payment }) => payment);
    
    res.json(safePaymentsData);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// Update payment details status (admin only)
router.patch("/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { paymentStatus, errorMessage, transactionId } = req.body;
    
    const [updatedPayment] = await db
      .update(paymentDetails)
      .set({
        paymentStatus,
        errorMessage,
        transactionId,
        updatedAt: new Date(),
      })
      .where(eq(paymentDetails.id, paymentId))
      .returning();
    
    if (!updatedPayment) {
      return res.status(404).json({ error: "Payment details not found" });
    }
    
    // Update associated booking if payment status changed
    if (paymentStatus) {
      const bookingPaymentStatus = paymentStatus === "success" ? "paid" : 
                                  paymentStatus === "failed" ? "unpaid" : "pending";
      
      const bookingStatus = paymentStatus === "success" ? "confirmed" : null;
      
      const updateData: any = { paymentStatus: bookingPaymentStatus };
      if (bookingStatus) updateData.status = bookingStatus;
      
      await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, updatedPayment.bookingId));
    }
    
    // Never return the CVC
    const { cardCVC, ...safePaymentData } = updatedPayment;
    
    res.json(safePaymentData);
  } catch (error) {
    console.error("Error updating payment details:", error);
    res.status(500).json({ error: "Failed to update payment details" });
  }
});

export default router;