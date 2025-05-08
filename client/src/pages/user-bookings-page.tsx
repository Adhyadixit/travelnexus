import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import { Booking, Package, Hotel, Cab, Cruise, Event, Destination } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Package as PackageIcon,
  Building,
  Car,
  Ship,
  Calendar,
  Loader2,
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Helmet } from 'react-helmet';

type BookingWithDetails = Booking & {
  itemDetails?: any;
  destinationName?: string;
};

export default function UserBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });
  
  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
    enabled: bookings.some(b => b.bookingType === "package"),
  });
  
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
    enabled: bookings.some(b => b.bookingType === "hotel"),
  });
  
  const { data: cabs = [] } = useQuery<Cab[]>({
    queryKey: ["/api/cabs"],
    enabled: bookings.some(b => b.bookingType === "cab"),
  });
  
  const { data: cruises = [] } = useQuery<Cruise[]>({
    queryKey: ["/api/cruises"],
    enabled: bookings.some(b => b.bookingType === "cruise"),
  });
  
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: bookings.some(b => b.bookingType === "event"),
  });
  
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Check if we're still loading any data
  const isLoading = bookingsLoading || !user;
  
  // Organize bookings by type and add item details
  const bookingsWithDetails: BookingWithDetails[] = bookings.map(booking => {
    let itemDetails;
    let destinationName;
    
    if (booking.bookingType === "package") {
      itemDetails = packages.find(p => p.id === booking.itemId);
      if (itemDetails) {
        const destination = destinations.find(d => d.id === itemDetails.destinationId);
        destinationName = destination?.name;
      }
    } else if (booking.bookingType === "hotel") {
      itemDetails = hotels.find(h => h.id === booking.itemId);
      if (itemDetails) {
        const destination = destinations.find(d => d.id === itemDetails.destinationId);
        destinationName = destination?.name;
      }
    } else if (booking.bookingType === "cab") {
      itemDetails = cabs.find(c => c.id === booking.itemId);
      if (itemDetails) {
        const destination = destinations.find(d => d.id === itemDetails.destinationId);
        destinationName = destination?.name;
      }
    } else if (booking.bookingType === "cruise") {
      itemDetails = cruises.find(c => c.id === booking.itemId);
    } else if (booking.bookingType === "event") {
      itemDetails = events.find(e => e.id === booking.itemId);
      if (itemDetails) {
        const destination = destinations.find(d => d.id === itemDetails.destinationId);
        destinationName = destination?.name;
      }
    }
    
    return {
      ...booking,
      itemDetails,
      destinationName,
    };
  });
  
  // Get active, upcoming, and past bookings
  const activeBookings = bookingsWithDetails.filter(b => 
    b.status === "confirmed" && new Date(b.startDate) <= new Date() && 
    (!b.endDate || new Date(b.endDate) >= new Date())
  );
  
  const upcomingBookings = bookingsWithDetails.filter(b => 
    (b.status === "confirmed" || b.status === "pending") && 
    new Date(b.startDate) > new Date()
  );
  
  const pastBookings = bookingsWithDetails.filter(b => 
    b.status === "completed" || 
    (b.status === "confirmed" && b.endDate && new Date(b.endDate) < new Date()) ||
    b.status === "cancelled"
  );
  
  const handleCancelBooking = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await apiRequest("PUT", `/api/bookings/${bookingId}`, {
        status: "cancelled"
      });
      
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel booking.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };
  
  // Helper function to render badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success">Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-primary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper function to get icon based on booking type
  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case "package":
        return <PackageIcon className="h-4 w-4" />;
      case "hotel":
        return <Building className="h-4 w-4" />;
      case "cab":
        return <Car className="h-4 w-4" />;
      case "cruise":
        return <Ship className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Format booking type for display
  const formatBookingType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <PageContainer>
      <Helmet>
        <title>My Bookings | TravelEase</title>
        <meta name="description" content="View and manage your travel bookings, including hotels, packages, cab services, and cruises. Check booking status and details." />
        <meta property="og:title" content="My Bookings | TravelEase" />
        <meta property="og:description" content="Manage all your travel reservations in one place." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Bookings Found</CardTitle>
              <CardDescription>You don't have any bookings yet.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/packages")}>Explore Packages</Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>
            
            {[
              { id: "upcoming", bookings: upcomingBookings, emptyMessage: "You don't have any upcoming bookings." },
              { id: "active", bookings: activeBookings, emptyMessage: "You don't have any active bookings." },
              { id: "past", bookings: pastBookings, emptyMessage: "You don't have any past bookings." },
            ].map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                {tab.bookings.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>No {tab.id.charAt(0).toUpperCase() + tab.id.slice(1)} Bookings</CardTitle>
                      <CardDescription>{tab.emptyMessage}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button onClick={() => navigate("/packages")}>Explore Packages</Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tab.id.charAt(0).toUpperCase() + tab.id.slice(1)} Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Booking ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tab.bookings.map(booking => (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">#{booking.id}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getBookingTypeIcon(booking.bookingType)}
                                    <span>{formatBookingType(booking.bookingType)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div className="truncate font-medium">
                                    {booking.itemDetails?.name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {booking.destinationName || ""}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {format(new Date(booking.startDate), "MMM dd, yyyy")}
                                  </div>
                                  {booking.endDate && (
                                    <div className="text-sm text-muted-foreground">
                                      to {format(new Date(booking.endDate), "MMM dd, yyyy")}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(booking.status)}
                                </TableCell>
                                <TableCell className="font-medium">
                                  ${booking.totalPrice.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/bookings/${booking.id}`)}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    
                                    {tab.id === "upcoming" && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to cancel this booking? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleCancelBooking(booking.id)}
                                              className="bg-destructive hover:bg-destructive/90"
                                            >
                                              {cancellingId === booking.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                              ) : null}
                                              Confirm
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
}
