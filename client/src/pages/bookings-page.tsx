import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Booking } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { BookingCard } from "@/components/bookings/booking-card";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BookingsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Fetch user's bookings
  const { 
    data: bookings,
    isLoading
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });
  
  // Get additional details for bookings
  // In a real app, we'd either have these details embedded in the booking or fetch them
  // For this example, we'll simulate it with some mock data since the API doesn't exist yet
  const getBookingDetails = (booking: Booking) => {
    const sampleNames = {
      package: "Amazing Vacation Package",
      hotel: "Luxury Resort & Spa",
      driver: "Professional Private Driver",
      cruise: "Caribbean Dream Cruise",
      event: "Cultural Experience Event"
    };
    
    const sampleImages = {
      package: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      hotel: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      driver: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      cruise: "https://images.unsplash.com/photo-1548574505-5e239809ee19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      event: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
    };
    
    return {
      name: sampleNames[booking.bookingType as keyof typeof sampleNames],
      imageUrl: sampleImages[booking.bookingType as keyof typeof sampleImages]
    };
  };
  
  // Filter bookings based on status
  const filterBookings = (status: string | null) => {
    if (!bookings) return [];
    
    if (status === "all") return bookings;
    
    return bookings.filter(booking => booking.status === status);
  };
  
  const filteredBookings = filterBookings(activeTab);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <PageTitle 
            title="My Bookings" 
            subtitle="Manage your travel reservations and bookings"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full md:w-auto border-b mb-6 grid grid-cols-4 md:flex">
            <TabsTrigger value="all" className="flex-1 md:flex-initial">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 md:flex-initial">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-1 md:flex-initial">Confirmed</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-initial">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-heading font-medium mb-2">No bookings found</h3>
            <p className="text-neutral-600 mb-6">
              {activeTab === "all" 
                ? "You don't have any bookings yet. Start exploring and book your next adventure!"
                : `You don't have any ${activeTab} bookings. Check other categories or make new reservations.`
              }
            </p>
            <Link href="/">
              <Button>Explore Destinations</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const details = getBookingDetails(booking);
              return (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  packageName={booking.bookingType === "package" ? details.name : undefined}
                  hotelName={booking.bookingType === "hotel" ? details.name : undefined}
                  driverName={booking.bookingType === "driver" ? details.name : undefined}
                  cruiseName={booking.bookingType === "cruise" ? details.name : undefined}
                  eventName={booking.bookingType === "event" ? details.name : undefined}
                  imageUrl={details.imageUrl}
                />
              );
            })}
          </div>
        )}
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow flex">
            <div className="mr-4 bg-blue-50 text-blue-500 p-3 rounded-full h-fit">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Upcoming Trips</h3>
              <p className="text-neutral-600 text-sm mb-3">View your next adventures</p>
              <Link href="/bookings?status=confirmed">
                <Button variant="outline" size="sm">View Schedule</Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow flex">
            <div className="mr-4 bg-green-50 text-green-500 p-3 rounded-full h-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Travel Insurance</h3>
              <p className="text-neutral-600 text-sm mb-3">Protect your trips with coverage</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow flex">
            <div className="mr-4 bg-purple-50 text-purple-500 p-3 rounded-full h-fit">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Travel History</h3>
              <p className="text-neutral-600 text-sm mb-3">Explore your past journeys</p>
              <Link href="/bookings?status=completed">
                <Button variant="outline" size="sm">View History</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
