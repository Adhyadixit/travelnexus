import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Booking } from '@shared/schema';
import { 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  Loader2, 
  CreditCard, 
  FileText,
  Search,
  Filter
} from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function BookingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  
  const { toast } = useToast();
  
  // Fetch all bookings for the logged-in user
  const { data: bookings, isLoading, error } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  // Filter bookings based on search and selected tab
  const filteredBookings = bookings?.filter(booking => {
    // Filter by search term if provided
    const matchesSearch = !searchTerm || (
      booking.id.toString().includes(searchTerm) ||
      booking.bookingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.startDate.toString().includes(searchTerm) ||
      booking.endDate.toString().includes(searchTerm) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by tab selection
    const matchesTab = selectedTab === 'all' || 
                     (selectedTab === 'pending' && booking.status === 'pending') ||
                     (selectedTab === 'confirmed' && booking.status === 'confirmed') ||
                     (selectedTab === 'completed' && booking.status === 'completed') ||
                     (selectedTab === 'cancelled' && booking.status === 'cancelled');
    
    return matchesSearch && matchesTab;
  });
  
  // Handle cancel booking
  const handleCancelBooking = async (bookingId: number) => {
    try {
      await apiRequest("PATCH", `/api/bookings/${bookingId}`, { status: 'cancelled' });
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled."
      });
      
      // Invalidate bookings query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error cancelling booking",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to load bookings</h2>
            <p className="text-neutral-600 mb-4">Please try again later</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bookings'] })}>
              Retry
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Bookings - TravelEase</title>
        <meta name="description" content="Manage your travel bookings including packages, hotels, cabs, events and cruises. View, modify or cancel your reservations." />
        <meta property="og:title" content="My Bookings - TravelEase" />
        <meta property="og:description" content="Manage your travel bookings including packages, hotels, cabs, events and cruises." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          <section className="bg-primary text-white py-8 md:py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">My Bookings</h1>
                <p className="mb-6">Manage all your bookings in one place</p>
                
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search by booking ID, type or status..." 
                      className="pl-9 bg-white/10 text-white border-white/20 placeholder:text-white/60 focus-visible:ring-white"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="md:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white md:w-auto w-full">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Filter Bookings</DialogTitle>
                          <DialogDescription>
                            Select filters to narrow your search
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-medium text-sm">Status</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                                <Button 
                                  key={status}
                                  variant={selectedTab === status ? "default" : "outline"}
                                  className="capitalize"
                                  onClick={() => {
                                    setSelectedTab(status);
                                  }}
                                >
                                  {status}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedTab('all');
                                setSearchTerm('');
                              }}
                            >
                              Reset Filters
                            </Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button>Apply Filters</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="w-full md:w-auto grid grid-cols-5 md:flex">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-6">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredBookings?.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                        <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
                        <p className="text-neutral-600 mb-4">
                          {searchTerm || selectedTab !== 'all' ? 
                            "Try adjusting your filters or search for different keywords" : 
                            "You haven't made any bookings yet"}
                        </p>
                        {(searchTerm || selectedTab !== 'all') && (
                          <Button 
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedTab('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredBookings?.map(booking => (
                          <BookingCard 
                            key={booking.id} 
                            booking={booking} 
                            onCancelBooking={handleCancelBooking} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Tabs>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
        <MobileNav />
      </div>
    </>
  );
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Function to get badge variant based on status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    case 'completed':
      return 'success';
    default:
      return 'secondary';
  }
};

// Function to get payment status badge variant
const getPaymentBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Convert booking type to display name
const getBookingTypeDisplay = (type: string) => {
  switch (type) {
    case 'package':
      return 'Travel Package';
    case 'hotel':
      return 'Hotel Stay';
    case 'driver':
      return 'Private Driver';
    case 'cruise':
      return 'Cruise';
    case 'event':
      return 'Event';
    default:
      return type;
  }
};

interface BookingCardProps {
  booking: Booking;
  onCancelBooking: (id: number) => Promise<void>;
}

function BookingCard({ booking, onCancelBooking }: BookingCardProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Function to handle cancel booking with confirmation
  const handleCancel = async () => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return;
    }
    
    setIsCancelling(true);
    try {
      await onCancelBooking(booking.id);
    } finally {
      setIsCancelling(false);
      setIsConfirmDialogOpen(false);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-6 py-4 bg-neutral-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <div>
              <span className="text-neutral-500 text-sm">Booking ID</span>
              <h3 className="font-medium">#{booking.id}</h3>
            </div>
            
            <Separator orientation="vertical" className="hidden md:block h-8" />
            
            <div>
              <span className="text-neutral-500 text-sm">Type</span>
              <p className="font-medium capitalize">{getBookingTypeDisplay(booking.bookingType)}</p>
            </div>
            
            <Separator orientation="vertical" className="hidden md:block h-8" />
            
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(booking.status) as any} className="capitalize">
                {booking.status}
              </Badge>
              <Badge variant={getPaymentBadgeVariant(booking.paymentStatus) as any} className="capitalize">
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 self-end md:self-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Booking Details</DialogTitle>
                  <DialogDescription>
                    Booking #{booking.id} - {getBookingTypeDisplay(booking.bookingType)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500">Status</h4>
                      <Badge variant={getStatusBadgeVariant(booking.status) as any} className="mt-1 capitalize">
                        {booking.status}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500">Payment</h4>
                      <Badge variant={getPaymentBadgeVariant(booking.paymentStatus) as any} className="mt-1 capitalize">
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-500 mb-2">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-sm">From: {formatDate(booking.startDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-sm">To: {formatDate(booking.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-neutral-500 mr-2" />
                      <span className="text-sm">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-neutral-500 mr-2" />
                      <span className="text-sm font-semibold">${booking.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-500 mb-1">Notes</h4>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button variant="outline">
                        No, keep booking
                      </Button>
                    </DialogClose>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Yes, cancel booking
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-500" />
              <div>
                <span className="block text-neutral-500 text-xs">Check-in / Start</span>
                <span className="font-medium">{formatDate(booking.startDate)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-500" />
              <div>
                <span className="block text-neutral-500 text-xs">Check-out / End</span>
                <span className="font-medium">{formatDate(booking.endDate)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neutral-500" />
              <div>
                <span className="block text-neutral-500 text-xs">Guests</span>
                <span className="font-medium">{booking.guests}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-neutral-500" />
              <div>
                <span className="block text-neutral-500 text-xs">Total Price</span>
                <span className="font-medium">${booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
              <div className="flex items-center text-green-600 text-sm">
                <Check className="h-4 w-4 mr-1" />
                Your booking is confirmed and ready to go!
              </div>
            )}
            
            {booking.status === 'pending' && (
              <div className="flex items-center text-amber-600 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                Your booking is awaiting confirmation
              </div>
            )}
            
            {booking.status === 'cancelled' && (
              <div className="flex items-center text-red-600 text-sm">
                <X className="h-4 w-4 mr-1" />
                This booking has been cancelled
              </div>
            )}
            
            {booking.status === 'completed' && (
              <div className="flex items-center text-green-600 text-sm">
                <Check className="h-4 w-4 mr-1" />
                This booking has been completed
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
