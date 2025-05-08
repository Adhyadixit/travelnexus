import { useState } from "react";
import { useParams, Link, useNavigate } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Package, Destination } from "@shared/schema";
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
import { formatCurrency, parseIncludedItems } from "@/lib/utils";
import { CalendarIcon, ClockIcon, MapPinIcon, Star } from "lucide-react";
import { format } from "date-fns";

export default function PackageDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, navigate] = useNavigate();
  const { user } = useAuth();
  
  // State for booking
  const [startDate, setStartDate] = useState<Date>();
  const [guests, setGuests] = useState("2");
  
  // Fetch package details
  const { 
    data: packageData,
    isLoading: isLoadingPackage
  } = useQuery<Package>({
    queryKey: [`/api/packages/${id}`],
  });
  
  // Fetch destination details if package has destinationId
  const {
    data: destination,
    isLoading: isLoadingDestination
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${packageData?.destinationId}`],
    enabled: !!packageData?.destinationId,
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      navigate(`/auth?redirect=/packages/${id}`);
      return;
    }
    
    if (!startDate) {
      return;
    }
    
    // Calculate end date based on package duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (packageData?.duration || 0));
    
    navigate(`/checkout/package/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}`);
  };
  
  // Parse included items
  const includedItems = packageData ? parseIncludedItems(packageData.included) : [];
  
  const isLoading = isLoadingPackage || (packageData?.destinationId && isLoadingDestination);

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

  if (!packageData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Package Not Found</h1>
          <p className="mb-8">The package you're looking for doesn't exist or has been removed.</p>
          <Link href="/packages">
            <Button>Browse All Packages</Button>
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
                src={packageData.imageUrl} 
                alt={packageData.name} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {packageData.trending && (
                    <Badge variant="secondary" className="bg-primary-light">Trending</Badge>
                  )}
                  {packageData.featured && (
                    <Badge variant="secondary" className="bg-accent">Featured</Badge>
                  )}
                </div>
                
                <h1 className="text-3xl font-heading font-bold mb-2">{packageData.name}</h1>
                
                {destination && (
                  <div className="flex items-center mb-2">
                    <MapPinIcon className="text-neutral-500 w-4 h-4 mr-1" />
                    <span className="text-neutral-600">{destination.name}, {destination.country}</span>
                  </div>
                )}
                
                <div className="flex items-center mb-2">
                  <ClockIcon className="text-neutral-500 w-4 h-4 mr-1" />
                  <span className="text-neutral-600">{packageData.duration} days</span>
                </div>
                
                {packageData.rating && (
                  <div className="flex">
                    <Star className="text-secondary w-5 h-5 fill-current mr-1" />
                    <span className="font-medium">{packageData.rating.toFixed(1)}</span>
                    {packageData.reviewCount > 0 && (
                      <span className="text-neutral-500 text-sm ml-2">({packageData.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-right bg-primary/5 p-4 rounded-lg">
                <div className="text-lg text-neutral-500">Starting from</div>
                <div className="text-3xl font-heading font-bold">{formatCurrency(packageData.price)}</div>
                <div className="text-sm text-neutral-500">per person</div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="included">What's Included</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">About This Package</h2>
                <p className="text-neutral-600 whitespace-pre-line">{packageData.description}</p>
              </TabsContent>
              
              <TabsContent value="included" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {includedItems.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="itinerary" className="mt-6">
                <h2 className="text-xl font-heading font-bold mb-4">Itinerary</h2>
                <div className="space-y-4">
                  {[...Array(packageData.duration)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border">
                      <h3 className="font-heading font-semibold text-lg">Day {i + 1}</h3>
                      {i === 0 && (
                        <p className="text-neutral-600 mt-2">
                          Arrival, hotel check-in, and welcome dinner.
                        </p>
                      )}
                      {i === packageData.duration - 1 && (
                        <p className="text-neutral-600 mt-2">
                          Breakfast, last-minute shopping, and departure.
                        </p>
                      )}
                      {i !== 0 && i !== packageData.duration - 1 && (
                        <p className="text-neutral-600 mt-2">
                          Explore local attractions, enjoy cultural experiences, and savor local cuisine.
                        </p>
                      )}
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
                <h2 className="text-xl font-heading font-bold mb-4">Book This Package</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
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
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <div className="bg-neutral-50 p-3 rounded-lg border text-neutral-500">
                        {format(new Date(startDate.getTime() + packageData.duration * 24 * 60 * 60 * 1000), "PPP")}
                        <div className="text-xs mt-1">
                          ({packageData.duration} days package)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Travelers</label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of travelers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Traveler</SelectItem>
                        <SelectItem value="2">2 Travelers</SelectItem>
                        <SelectItem value="3">3 Travelers</SelectItem>
                        <SelectItem value="4">4 Travelers</SelectItem>
                        <SelectItem value="5">5 Travelers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{formatCurrency(packageData.price)} x {guests} travelers</span>
                      <span>{formatCurrency(packageData.price * parseInt(guests))}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(packageData.price * parseInt(guests))}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!startDate}
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
