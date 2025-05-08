import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Hotel } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, parseAmenities } from "@/lib/utils";
import { CalendarIcon, CheckIcon, MapPinIcon, Star } from "lucide-react";
import { format } from "date-fns";

export default function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // State for booking
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [guests, setGuests] = useState("2");
  
  // Fetch hotel details
  const { 
    data: hotel,
    isLoading
  } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`],
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      setLocation(`/auth?redirect=/hotels/${id}`);
      return;
    }
    
    if (!startDate || !endDate) {
      return;
    }
    
    setLocation(`/checkout/hotel/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}`);
  };
  
  // Parse amenities
  const amenitiesList = hotel ? parseAmenities(hotel.amenities) : [];
  
  // Calculate total nights and price
  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    return nights * (hotel?.price || 0);
  };
  
  const nights = calculateNights();
  const totalPrice = calculateTotalPrice();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-full max-w-2xl" />
              <Skeleton className="h-6 w-full max-w-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Hotel Not Found</h1>
          <p className="mb-8">The hotel you're looking for doesn't exist or has been removed.</p>
          <Link href="/hotels">
            <Button>Browse All Hotels</Button>
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
            <div className="rounded-xl overflow-hidden mb-6">
              <img 
                src={hotel.imageUrl} 
                alt={hotel.name} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2">{hotel.name}</h1>
                <div className="flex items-center mb-2">
                  <MapPinIcon className="text-neutral-500 w-4 h-4 mr-1" />
                  <span className="text-neutral-600">{hotel.address}</span>
                </div>
                <div className="flex">
                  {[...Array(hotel.rating)].map((_, i) => (
                    <Star key={i} className="text-secondary w-5 h-5 fill-current" />
                  ))}
                  {hotel.reviewCount > 0 && (
                    <span className="text-neutral-500 text-sm ml-2">({hotel.reviewCount} reviews)</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg text-neutral-500">Per night from</div>
                <div className="text-3xl font-heading font-bold">{formatCurrency(hotel.price)}</div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">About {hotel.name}</h2>
                <p className="text-neutral-600 whitespace-pre-line">{hotel.description}</p>
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">Hotel Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amenitiesList.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <CheckIcon className="text-primary w-5 h-5 mr-2" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="location" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">Location</h2>
                <p className="text-neutral-600 mb-4">{hotel.address}</p>
                <div className="aspect-video rounded-lg overflow-hidden bg-neutral-200">
                  {/* Map would go here in a real app */}
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    Interactive map would be displayed here
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Booking sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Book Your Stay</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          {startDate ? (
                            format(startDate, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-out Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          {endDate ? (
                            format(endDate, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            date < (startDate || new Date())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Guests</label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of guests" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Guest</SelectItem>
                        <SelectItem value="2">2 Guests</SelectItem>
                        <SelectItem value="3">3 Guests</SelectItem>
                        <SelectItem value="4">4 Guests</SelectItem>
                        <SelectItem value="5">5 Guests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {nights > 0 && (
                    <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>{formatCurrency(hotel.price)} x {nights} nights</span>
                        <span>{formatCurrency(hotel.price * nights)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!startDate || !endDate}
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
