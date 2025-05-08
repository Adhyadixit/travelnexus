import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  formatCurrency, 
  parseIncludedItems, 
  parseItinerary, 
  truncateText 
} from "@/lib/utils";
import { InquiryForm } from "@/components/inquiry-form";
import { 
  Plane,
  Bus, 
  CalendarIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CreditCard, 
  Crop, 
  HelpCircle, 
  Hotel, 
  Info, 
  Luggage,
  MapPin, 
  MinusCircle, 
  Building, 
  Plane as PlaneTakeoff, 
  Plus, 
  Shield, 
  Sparkles, 
  Star, 
  Ticket, 
  Train, 
  Utensils, 
  User, 
  Users, 
  X,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";

export default function PackageDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
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
  
  // Fetch all packages to filter for similar packages
  const {
    data: allPackages,
    isLoading: isLoadingAllPackages
  } = useQuery<Package[]>({
    queryKey: ['/api/packages'],
    enabled: !!destination,
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      setLocation(`/auth?redirect=/packages/${id}`);
      return;
    }
    
    if (!startDate) {
      return;
    }
    
    // Calculate end date based on package duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (packageData?.duration || 0));
    
    // Use the correct URL format matching the route in App.tsx
    setLocation(`/checkout/package/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}`);
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

  // Parse JSON fields
  const citiesCovered = packageData.citiesCovered ? JSON.parse(packageData.citiesCovered || '[]') : [];
  const excludedItems = packageData.excluded ? JSON.parse(packageData.excluded || '[]') : [];
  const hotelInfo = packageData.hotels ? JSON.parse(packageData.hotels || '[]') : [];
  const itineraryData = packageData.itinerary ? JSON.parse(packageData.itinerary || '{}') : {};
  const highlights = packageData.highlights ? JSON.parse(packageData.highlights || '[]') : [];
  const meals = packageData.meals ? JSON.parse(packageData.meals || '{}') : {};

  // Sample reviews (since we don't have real review data)
  const REVIEWS = [
    {
      id: 1,
      author: "Sarah Johnson",
      date: "2023-12-15",
      rating: 9.5,
      comment: "Absolutely amazing experience! The guides were knowledgeable and the accommodations were top-notch.",
      categories: {
        service: 9.5,
        accommodation: 9.0,
        transportation: 9.2,
        food: 9.3,
        valueForMoney: 9.0
      }
    },
    {
      id: 2,
      author: "Michael Brown",
      date: "2023-11-28",
      rating: 8.8,
      comment: "Great tour package! Everything was well organized. The hotels were comfortable and clean.",
      categories: {
        service: 9.0,
        accommodation: 8.5,
        transportation: 8.8,
        food: 8.7,
        valueForMoney: 9.0
      }
    }
  ];

  // Sample frequently asked questions
  const PACKAGE_FAQS = [
    {
      question: "Can I customize this tour package?",
      answer: packageData.customizable ? 
        "Yes, this package is customizable. You can add or remove activities, or modify the accommodation based on your preferences." :
        "This is a fixed group tour package and cannot be customized. However, we have other customizable packages available."
    },
    {
      question: "What is the cancellation policy?",
      answer: "Free cancellation up to 30 days before departure. 50% refund for cancellations 15-29 days before departure. No refund for cancellations less than 15 days before departure."
    },
    {
      question: "Is travel insurance included?",
      answer: "Travel insurance is not included in the package price. We strongly recommend purchasing travel insurance for your trip."
    },
    {
      question: "What is the minimum number of travelers required?",
      answer: `The minimum number of travelers required is ${packageData.minTravelers || 1}.`
    }
  ];

  // Calculate average review rating
  const averageRating = REVIEWS.reduce((sum, review) => sum + review.rating, 0) / REVIEWS.length;

  // Determine travel mode icon
  const getTravelModeIcon = (mode?: string | null) => {
    switch(mode?.toLowerCase()) {
      case 'flight': return <Plane className="w-5 h-5 text-primary" />;
      case 'train': return <Train className="w-5 h-5 text-primary" />;
      case 'bus': return <Bus className="w-5 h-5 text-primary" />;
      default: return <Plane className="w-5 h-5 text-primary" />;
    }
  };

  // Get meal icon and label
  const getMealInfo = (day: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const dayMeals = meals[`day${day}`] || {};
    return {
      included: dayMeals[mealType] === true,
      label: mealType.charAt(0).toUpperCase() + mealType.slice(1)
    };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-neutral-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/packages" className="hover:text-primary">Tour Packages</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{packageData.name}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            {/* Image Gallery */}
            <div className="rounded-xl overflow-hidden mb-6 relative group">
              <img 
                src={packageData.imageUrl} 
                alt={packageData.name} 
                className="w-full h-[400px] object-cover"
              />
              {/* Gallery controls - would be connected to actual gallery in production */}
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {/* Image count indicator */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                1/4
              </div>
              {/* Tags */}
              <div className="absolute top-4 left-4 flex gap-2">
                {packageData.flightIncluded && (
                  <Badge className="bg-primary text-white hover:bg-primary">Flight Included</Badge>
                )}
                {packageData.trending && (
                  <Badge variant="secondary" className="bg-secondary text-white hover:bg-secondary">Trending</Badge>
                )}
                {packageData.featured && (
                  <Badge variant="secondary" className="bg-accent hover:bg-accent">Featured</Badge>
                )}
              </div>
            </div>
            
            {/* Package Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">{packageData.name}</h1>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  {destination && (
                    <div className="flex items-center">
                      <MapPin className="text-primary w-4 h-4 mr-1" />
                      <span className="text-neutral-600">{destination.name}, {destination.country}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Clock className="text-primary w-4 h-4 mr-1" />
                    <span className="text-neutral-600">{packageData.duration} Days / {packageData.duration - 1} Nights</span>
                  </div>
                  
                  {packageData.rating && (
                    <div className="flex items-center">
                      <Star className="text-secondary w-4 h-4 fill-current mr-1" />
                      <span className="font-medium">{packageData.rating.toFixed(1)}</span>
                      {packageData.reviewCount && packageData.reviewCount > 0 && (
                        <span className="text-neutral-500 text-sm ml-1">({packageData.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleBookNow}
                  >
                    Book Now
                  </Button>
                  <InquiryForm
                    productName={packageData.name}
                    defaultSubject={`Inquiry about ${packageData.name} package`}
                    triggerButtonText="Inquire Now"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-auto bg-primary/5 p-4 rounded-lg shadow-sm">
                <div className="text-base text-neutral-500">Starting from</div>
                <div className="text-3xl font-heading font-bold text-primary">{formatCurrency(packageData.price)}</div>
                <div className="text-sm text-neutral-500">per person</div>
              </div>
            </div>
            
            {/* Quick Highlights Bar */}
            <div className="bg-neutral-50 rounded-lg p-4 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-2 rounded-full mb-2">
                  {getTravelModeIcon(packageData.travelMode)}
                </div>
                <div className="text-sm font-medium mb-1">Travel Mode</div>
                <div className="text-xs text-neutral-500">
                  {packageData.travelMode || 'Flight'}
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-2 rounded-full mb-2">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium mb-1">Cities Covered</div>
                <div className="text-xs text-neutral-500">
                  {citiesCovered.length > 0 ? citiesCovered.length : 'Multiple'} cities
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-2 rounded-full mb-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium mb-1">Tour Type</div>
                <div className="text-xs text-neutral-500">
                  {packageData.typeOfTour || 'Group Tour'}
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-2 rounded-full mb-2">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium mb-1">Visa Assistance</div>
                <div className="text-xs text-neutral-500">
                  {packageData.visaAssistance ? 'Available' : 'Not Included'}
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-2 rounded-full mb-2">
                  <Crop className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium mb-1">Customizable</div>
                <div className="text-xs text-neutral-500">
                  {packageData.customizable ? 'Yes' : 'Fixed Package'}
                </div>
              </div>
            </div>
            
            {/* Price & Traveler Breakdown */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Price & Traveler Breakdown</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>Adult Price (12+ years)</span>
                    </div>
                    <span className="font-bold">{formatCurrency(packageData.price)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>Child with Bed (5-11 years)</span>
                    </div>
                    <span className="font-bold">{formatCurrency(packageData.price * 0.8)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>Child without Bed (2-4 years)</span>
                    </div>
                    <span className="font-bold">{formatCurrency(packageData.price * 0.5)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>Infant (0-23 months)</span>
                    </div>
                    <span className="font-bold">{formatCurrency(packageData.price * 0.1)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-center text-primary mb-2">
                      <Sparkles className="w-5 h-5 mr-2" />
                      <h3 className="font-bold">Limited Time Offers</h3>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                        <span>Early Bird Discount: Save 10% when booking 60 days in advance</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                        <span>Group Discount: 5% off for 4+ travelers</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CreditCard className="w-5 h-5 mr-2 text-neutral-700" />
                      <h3 className="font-bold">Payment Options</h3>
                    </div>
                    <p className="text-sm">
                      Pay securely online or reserve now pay later. EMI options available from $XX/month.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* What's Included/Excluded Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-heading font-bold mb-4 flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  What's Included
                </h2>
                
                <ul className="space-y-3">
                  {includedItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-heading font-bold mb-4 flex items-center">
                  <X className="w-5 h-5 text-red-500 mr-2" />
                  What's Excluded
                </h2>
                
                <ul className="space-y-3">
                  {excludedItems.length > 0 ? (
                    excludedItems.map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <MinusCircle className="w-4 h-4 text-red-500 mt-1 mr-2" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    [
                      "Personal expenses",
                      "Travel insurance",
                      "Activities not mentioned in the itinerary",
                      "Tips and gratuities"
                    ].map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <MinusCircle className="w-4 h-4 text-red-500 mt-1 mr-2" />
                        <span>{item}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            
            {/* Tour Highlights */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Tour Highlights</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {highlights.length > 0 ? (
                  highlights.map((highlight: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Sparkles className="w-5 h-5 text-secondary mt-0.5 mr-3" />
                      <span>{highlight}</span>
                    </div>
                  ))
                ) : (
                  [
                    `${packageData.duration}-day guided tour of ${destination?.name || 'beautiful destinations'}`,
                    "Stay in comfortable, handpicked accommodations",
                    "Explore iconic landmarks and hidden gems",
                    "Experience local culture and cuisine",
                    "Professional, knowledgeable tour guides"
                  ].map((highlight: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Sparkles className="w-5 h-5 text-secondary mt-0.5 mr-3" />
                      <span>{highlight}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Day by Day Itinerary */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Day-by-Day Itinerary</h2>
              
              <Accordion type="single" collapsible className="w-full">
                {[...Array(packageData.duration)].map((_, i) => {
                  const dayNum = i + 1;
                  const dayContent = itineraryData[`day${dayNum}`] || {
                    title: dayNum === 1 
                      ? "Arrival and Welcome" 
                      : dayNum === packageData.duration 
                        ? "Departure Day" 
                        : `Day ${dayNum} Exploration`,
                    description: dayNum === 1 
                      ? "Arrive at your destination, transfer to hotel, and enjoy a welcome dinner with your tour group." 
                      : dayNum === packageData.duration 
                        ? "Enjoy breakfast at the hotel, check-out, and transfer to the airport for your departure."
                        : "Explore local attractions with your guide, enjoy included meals, and experience the local culture."
                  };
                  
                  // Get meal information
                  const breakfast = getMealInfo(dayNum, 'breakfast');
                  const lunch = getMealInfo(dayNum, 'lunch');
                  const dinner = getMealInfo(dayNum, 'dinner');
                  
                  return (
                    <AccordionItem key={i} value={`day-${dayNum}`} className="border-b">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center">
                          <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
                            {dayNum}
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold">{dayContent.title || `Day ${dayNum}`}</h3>
                            <div className="flex space-x-3 text-sm text-neutral-500 mt-1">
                              {breakfast.included && (
                                <div className="flex items-center">
                                  <Utensils className="w-3 h-3 mr-1" />
                                  <span>{breakfast.label}</span>
                                </div>
                              )}
                              {lunch.included && (
                                <div className="flex items-center">
                                  <Utensils className="w-3 h-3 mr-1" />
                                  <span>{lunch.label}</span>
                                </div>
                              )}
                              {dinner.included && (
                                <div className="flex items-center">
                                  <Utensils className="w-3 h-3 mr-1" />
                                  <span>{dinner.label}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-14 pr-4 pb-4">
                        <p className="text-neutral-600 mb-4">{dayContent.description}</p>
                        
                        {dayContent.hotel && (
                          <div className="mb-3">
                            <div className="flex items-center text-neutral-800 font-medium mb-1">
                              <Hotel className="w-4 h-4 mr-2" />
                              Accommodation
                            </div>
                            <p className="text-neutral-600 ml-6">{dayContent.hotel}</p>
                          </div>
                        )}
                        
                        {dayContent.activities && (
                          <div className="mb-3">
                            <div className="flex items-center text-neutral-800 font-medium mb-1">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Activities
                            </div>
                            <ul className="text-neutral-600 ml-6 space-y-1">
                              {dayContent.activities.map((activity: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-primary mr-2">•</span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {dayContent.optionalActivities && (
                          <div>
                            <div className="flex items-center text-neutral-800 font-medium mb-1">
                              <Plus className="w-4 h-4 mr-2" />
                              Optional Add-ons
                            </div>
                            <ul className="text-neutral-600 ml-6 space-y-1">
                              {dayContent.optionalActivities.map((activity: any, idx: number) => (
                                <li key={idx} className="flex items-center justify-between">
                                  <div className="flex items-start">
                                    <span className="text-secondary mr-2">•</span>
                                    <span>{activity.name}</span>
                                  </div>
                                  <span className="font-medium">{formatCurrency(activity.price)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
            
            {/* Hotel Information */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4 flex items-center">
                <Hotel className="w-5 h-5 text-primary mr-2" />
                Accommodation Details
              </h2>
              
              {hotelInfo.length > 0 ? (
                <div className="space-y-4">
                  {hotelInfo.map((hotel: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="md:col-span-1">
                          <img 
                            src={hotel.imageUrl || packageData.imageUrl} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 md:col-span-3">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-bold text-lg">{hotel.name}</h3>
                            <div className="flex">
                              {[...Array(hotel.rating || 4)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-secondary fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-neutral-600 text-sm mb-2">{hotel.location}</p>
                          {hotel.amenities && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {hotel.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="bg-neutral-50">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-neutral-600">
                  <p>This package includes carefully selected accommodations based on quality and comfort.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                      <span>Comfortable, well-rated hotels throughout your journey</span>
                    </div>
                    <div className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                      <span>Conveniently located near attractions and city centers</span>
                    </div>
                    <div className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                      <span>Breakfast included at all accommodations</span>
                    </div>
                    <div className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-1 mr-2" />
                      <span>Clean, comfortable rooms with essential amenities</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Flight information if applicable */}
              {packageData.flightIncluded && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-lg flex items-center mb-4">
                    <PlaneTakeoff className="w-5 h-5 text-primary mr-2" />
                    Flight Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-medium">Outbound Flight</div>
                          <div className="text-sm text-neutral-500">Based on package start date</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Economy Class</div>
                          <div className="text-sm text-neutral-500">Baggage included</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-medium">Return Flight</div>
                          <div className="text-sm text-neutral-500">Based on package end date</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Economy Class</div>
                          <div className="text-sm text-neutral-500">Baggage included</div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-500">
                      * Actual flight details will be provided closer to departure date. 
                      Flight times are subject to change and availability.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reviews and Ratings Section */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-bold">Guest Reviews</h2>
                <div className="flex items-center">
                  <div className="bg-primary text-white font-bold w-10 h-10 rounded-md flex items-center justify-center mr-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {averageRating >= 9 ? 'Exceptional' : 
                       averageRating >= 8 ? 'Excellent' : 
                       averageRating >= 7 ? 'Very Good' : 
                       averageRating >= 6 ? 'Good' : 'Average'}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {REVIEWS.length} reviews
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['Service', 'Accommodation', 'Transportation', 'Food', 'Value'].map((category) => {
                    const categoryKey = category.toLowerCase() as keyof typeof REVIEWS[0]['categories'];
                    const avgScore = REVIEWS.reduce((sum, review) => sum + review.categories[categoryKey], 0) / REVIEWS.length;
                    
                    return (
                      <div key={category} className="flex flex-col">
                        <span className="text-neutral-700 text-sm">{category}</span>
                        <div className="flex items-center mt-1">
                          <span className="font-medium mr-2">{avgScore.toFixed(1)}</span>
                          <div className="bg-neutral-300 h-2 flex-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full" 
                              style={{ width: `${(avgScore/10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Reviews List */}
              <div className="space-y-6">
                {REVIEWS.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex justify-between mb-3">
                      <div>
                        <h4 className="font-bold">{review.author}</h4>
                        <div className="text-sm text-neutral-500">
                          Traveled on {new Date(review.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-primary text-white font-bold w-8 h-8 rounded-md flex items-center justify-center mr-1">
                          {review.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <p className="text-neutral-700">{review.comment}</p>
                  </Card>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Button variant="outline">See All Reviews</Button>
              </div>
            </div>
            
            {/* Frequently Asked Questions */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Frequently Asked Questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                {PACKAGE_FAQS.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left font-medium py-4">
                      <div className="flex items-center">
                        <HelpCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 pl-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="mt-6 bg-neutral-50 p-4 rounded-lg border">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium mb-1">Need more information?</h3>
                    <p className="text-sm text-neutral-600">
                      Contact our travel experts for any questions about this package.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm">Contact Us</Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Similar Packages */}
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold mb-6">You Might Also Like</h2>
              
              {allPackages && destination ? (
                (() => {
                  // Filter packages from the same country
                  const similarPackages = allPackages.filter(pkg => {
                    // Skip current package
                    if (pkg.id === parseInt(id as string)) return false;
                    
                    // Get destination for this package to check the country
                    const pkgDestId = pkg.destinationId;
                    const pkgDest = allPackages.find(p => p.destinationId === pkgDestId);
                    
                    return pkgDest && pkgDest.destinationId === destination.id;
                  }).slice(0, 3);
                  
                  if (similarPackages.length === 0) {
                    return (
                      <div className="text-center py-8 bg-neutral-50 rounded-lg">
                        <Plane className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                        <p className="text-neutral-500">No similar packages available in {destination.country}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {similarPackages.map((similarPackage) => (
                        <Card key={similarPackage.id} className="overflow-hidden h-full">
                          <div className="relative">
                            <img 
                              src={similarPackage.imageUrl}
                              alt={similarPackage.name}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <div className="text-white font-medium">{similarPackage.name}</div>
                              <div className="text-white/80 text-sm">
                                {similarPackage.duration} Days / {similarPackage.duration - 1} Nights
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <MapPin className="w-4 h-4 text-neutral-500 mr-1" />
                              <span className="text-neutral-600 text-sm">{destination.name}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < Math.floor(similarPackage.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`} 
                                  />
                                ))}
                              </div>
                              <div className="font-bold">{formatCurrency(similarPackage.price)}</div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Link href={`/packages/${similarPackage.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden h-full">
                      <div className="h-48 bg-neutral-100 animate-pulse" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-neutral-100 animate-pulse mb-2" />
                        <div className="h-4 bg-neutral-100 animate-pulse mb-2 w-2/3" />
                        <div className="h-8 bg-neutral-100 animate-pulse mt-3" />
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <div className="h-8 bg-neutral-100 animate-pulse w-full" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Booking sidebar */}
          <div>
            <Card className="sticky top-6">
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
                  
                  <div className="mt-3">
                    <InquiryForm
                      productName={packageData.name}
                      defaultSubject={`Inquiry about ${packageData.name} package`}
                      triggerButtonText="Need Help? Inquire Now"
                      triggerButtonFullWidth={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
