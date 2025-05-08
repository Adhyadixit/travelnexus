import { useState } from "react";
import { useParams, Link, useNavigate } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Cruise } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, ClockIcon, AnchorIcon, ShipIcon, Star } from "lucide-react";
import { format } from "date-fns";

export default function CruiseDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, navigate] = useNavigate();
  const { user } = useAuth();
  
  // State for booking
  const [startDate, setStartDate] = useState<Date>();
  const [guests, setGuests] = useState("2");
  
  // Fetch cruise details
  const { 
    data: cruise,
    isLoading
  } = useQuery<Cruise>({
    queryKey: [`/api/cruises/${id}`],
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      navigate(`/auth?redirect=/cruises/${id}`);
      return;
    }
    
    if (!startDate) {
      return;
    }
    
    // Calculate end date based on cruise duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (cruise?.duration || 0));
    
    navigate(`/checkout/cruise/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}`);
  };
  
  // Parse itinerary
  const getItinerary = () => {
    if (!cruise) return {};
    
    try {
      return JSON.parse(cruise.itinerary);
    } catch (e) {
      return {};
    }
  };
  
  const itinerary = getItinerary();

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

  if (!cruise) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Cruise Not Found</h1>
          <p className="mb-8">The cruise you're looking for doesn't exist or has been removed.</p>
          <Link href="/cruises">
            <Button>Browse All Cruises</Button>
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
                src={cruise.imageUrl} 
                alt={cruise.name} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cruise.featured && (
                    <Badge variant="secondary" className="bg-accent">Luxury</Badge>
                  )}
                </div>
                
                <h1 className="text-3xl font-heading font-bold mb-2">{cruise.name}</h1>
                
                <div className="flex items-center mb-2">
                  <ShipIcon className="text-neutral-500 w-4 h-4 mr-1" />
                  <span className="text-neutral-600">{cruise.company}</span>
                </div>
                
                <div className="flex items-center mb-2">
                  <AnchorIcon className="text-neutral-500 w-4 h-4 mr-1" />
                  <span className="text-neutral-600">Departs from {cruise.departure}</span>
                </div>
                
                <div className="flex items-center mb-2">
                  <ClockIcon className="text-neutral-500 w-4 h-4 mr-1" />
                  <span className="text-neutral-600">{cruise.duration} days</span>
                </div>
                
                {cruise.rating && (
                  <div className="flex">
                    <Star className="text-secondary w-5 h-5 fill-current mr-1" />
                    <span className="font-medium">{cruise.rating.toFixed(1)}</span>
                    {cruise.reviewCount > 0 && (
                      <span className="text-neutral-500 text-sm ml-2">({cruise.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-right bg-primary/5 p-4 rounded-lg">
                <div className="text-lg text-neutral-500">Starting from</div>
                <div className="text-3xl font-heading font-bold">{formatCurrency(cruise.price)}</div>
                <div className="text-sm text-neutral-500">per person</div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">About This Cruise</h2>
                <p className="text-neutral-600 whitespace-pre-line">{cruise.description}</p>
              </TabsContent>
              
              <TabsContent value="itinerary" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">Cruise Itinerary</h2>
                <div className="space-y-4">
                  {Object.keys(itinerary).length > 0 ? (
                    Object.entries(itinerary).map(([day, description], index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <h3 className="font-heading font-semibold text-lg">{day}</h3>
                        <p className="text-neutral-600 mt-2">{description}</p>
                      </div>
                    ))
                  ) : (
                    [...Array(cruise.duration)].map((_, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border">
                        <h3 className="font-heading font-semibold text-lg">Day {i + 1}</h3>
                        {i === 0 && (
                          <p className="text-neutral-600 mt-2">
                            Embarkation day. Board the ship and settle into your cabin.
                          </p>
                        )}
                        {i === cruise.duration - 1 && (
                          <p className="text-neutral-600 mt-2">
                            Return to port and disembarkation.
                          </p>
                        )}
                        {i !== 0 && i !== cruise.duration - 1 && (
                          <p className="text-neutral-600 mt-2">
                            Cruise day with various onboard activities and shore excursions.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">Cruise Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Swimming Pools", "Fine Dining Restaurants", "Spa & Wellness Center", 
                   "Fitness Center", "Entertainment Venues", "Casino", "Kids Club", 
                   "Shopping Galleries", "Wi-Fi", "24-hour Room Service"].map((amenity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Booking sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Book This Cruise</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Departure Date</label>
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
                  
                  {startDate && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Return Date</label>
                      <div className="bg-neutral-50 p-3 rounded-lg border text-neutral-500">
                        {format(new Date(startDate.getTime() + cruise.duration * 24 * 60 * 60 * 1000), "PPP")}
                        <div className="text-xs mt-1">
                          ({cruise.duration} days cruise)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Passengers</label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of passengers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Passenger</SelectItem>
                        <SelectItem value="2">2 Passengers</SelectItem>
                        <SelectItem value="3">3 Passengers</SelectItem>
                        <SelectItem value="4">4 Passengers</SelectItem>
                        <SelectItem value="5">5 Passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{formatCurrency(cruise.price)} x {guests} passengers</span>
                      <span>{formatCurrency(cruise.price * parseInt(guests))}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(cruise.price * parseInt(guests))}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!startDate}
                  >
                    Book Cruise
                  </Button>
                  
                  <p className="text-xs text-neutral-500 text-center">
                    Cabin availability will be confirmed during the booking process.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
