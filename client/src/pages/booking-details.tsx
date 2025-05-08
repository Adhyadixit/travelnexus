import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Booking, getBookingWithExtras, BookingWithExtras, UserWithFullName, getUserWithFullName } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, Info, CreditCard, FileText, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Fetch booking details
  const { 
    data: bookingData,
    isLoading
  } = useQuery<Booking>({
    queryKey: [`/api/bookings/${id}`],
  });
  
  // Process booking data with helper functions
  const booking = bookingData ? getBookingWithExtras(bookingData) : undefined;
  const userWithFullName = user ? getUserWithFullName(user) : undefined;
  
  // Handle cancellation
  const handleCancelBooking = async () => {
    if (!booking) return;
    
    try {
      // This would be a real API call in a production app
      await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
      });
      
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      
      // Redirect to bookings page
      setLocation("/bookings");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "outline";
    }
  };
  
  // Get payment status badge variant
  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  // Format booking type for display
  const formatBookingType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-full max-w-2xl" />
              <Skeleton className="h-6 w-full max-w-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Booking Not Found</h1>
          <p className="mb-8">The booking you're looking for doesn't exist or has been removed.</p>
          <Link href="/bookings">
            <Button>View All Bookings</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-heading font-bold mb-2">Booking #{booking.id}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{formatBookingType(booking.bookingType)}</Badge>
                    <Badge variant={getStatusBadgeVariant(booking.status) as any} className="capitalize">
                      {booking.status}
                    </Badge>
                    <Badge variant={getPaymentBadgeVariant(booking.paymentStatus) as any} className="capitalize">
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
                
                {booking.status !== "cancelled" && booking.status !== "completed" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel this booking? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="pt-4 space-y-4">
                        <p className="text-neutral-600">
                          Cancellation policy may apply. Please check the cancellation terms for this booking.
                        </p>
                        <div className="flex justify-end gap-2">
                          <DialogTrigger asChild>
                            <Button variant="outline">No, Keep Booking</Button>
                          </DialogTrigger>
                          <Button variant="destructive" onClick={handleCancelBooking}>
                            Yes, Cancel Booking
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Calendar className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Stay Period</div>
                    <div className="text-neutral-600">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Guests</div>
                    <div className="text-neutral-600">
                      {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Total Amount</div>
                    <div className="text-neutral-600">{formatCurrency(booking.totalAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Booking Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-3">Booking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-neutral-600">
                      <div>
                        <p className="font-medium text-black">Booking Type:</p>
                        <p className="mb-2">{formatBookingType(booking.bookingType)}</p>
                        
                        <p className="font-medium text-black">Booking Date:</p>
                        <p className="mb-2">{formatDate(booking.createdAt)}</p>
                        
                        <p className="font-medium text-black">Booking Status:</p>
                        <p>{booking.status}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-black">Payment Method:</p>
                        <p className="mb-2">Credit Card</p>
                        
                        <p className="font-medium text-black">Payment Status:</p>
                        <p className="mb-2">{booking.paymentStatus}</p>
                        
                        <p className="font-medium text-black">Transaction ID:</p>
                        <p>{booking.transactionId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-3">Guest Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-neutral-600">
                      <div>
                        <p className="font-medium text-black">Name:</p>
                        <p className="mb-2">{userWithFullName?.fullName || 'N/A'}</p>
                        
                        <p className="font-medium text-black">Email:</p>
                        <p>{userWithFullName?.email || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-black">Phone:</p>
                        <p className="mb-2">{userWithFullName?.phone || 'N/A'}</p>
                        
                        <p className="font-medium text-black">Special Requests:</p>
                        <p>{booking.specialRequests || 'None'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center md:justify-start gap-4">
              <Link href="/bookings">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  All Bookings
                </Button>
              </Link>
              
              <Button onClick={() => window.print()}>
                <FileText className="w-4 h-4 mr-2" />
                Print Details
              </Button>
            </div>
          </div>
          
          {/* Sidebar */}
          <div>
            <Card className="mb-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Booking Summary</h2>
                
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>{formatCurrency(booking.totalAmount * 0.8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Fees</span>
                      <span>{formatCurrency(booking.totalAmount * 0.2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-2">Cancellation Policy</h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>• Free cancellation up to 48 hours before check-in</p>
                  <p>• 50% refund between 48 and 24 hours before check-in</p>
                  <p>• No refund within 24 hours of check-in</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}