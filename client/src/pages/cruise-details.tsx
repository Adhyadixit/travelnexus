import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Cruise, CruiseCabinType } from "@shared/schema";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import { InquiryForm } from "@/components/inquiry-form";
import { 
  Anchor, 
  MapPin, 
  Clock, 
  Ship as ShipIcon, 
  Star, 
  Ship, 
  Calendar as CalendarIcon, 
  Users, 
  Utensils, 
  Wifi, 
  Music, 
  Star as StarIcon, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Globe,
  HeartPulse,
  Dumbbell,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  CheckCheck
} from "lucide-react";
import { format } from "date-fns";

// Define cabin types
interface CabinType {
  name: string;
  image: string;
  description: string;
  features: string[];
  price: number;
  availability: number;
}

export default function CruiseDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // State for inquiry-related chat
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [autoOpenChat, setAutoOpenChat] = useState(false);
  
  // Create the Layout component with chat props
  const Layout = isMobile 
    ? (props: any) => (
        <MobileLayout 
          {...props} 
          autoOpenChat={autoOpenChat} 
          currentConversationId={currentConversationId}
        />
      ) 
    : DesktopLayout;

  // State for booking
  const [startDate, setStartDate] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [selectedCabinType, setSelectedCabinType] = useState<string | null>(null);
  
  // State for image gallery navigation
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch cruise details
  const { 
    data: cruise,
    isLoading
  } = useQuery<Cruise>({
    queryKey: [`/api/cruises/${id}`],
  });
  
  // Fetch all cruises (to filter related ones)
  const { 
    data: allCruises
  } = useQuery<Cruise[]>({
    queryKey: ['/api/cruises'],
    enabled: !!cruise,
  });

  // Reference to the booking form section for scrolling
  const bookingFormRef = useRef<HTMLDivElement>(null);
  
  // Handle booking
  const handleBookNow = () => {
    // Always scroll to the booking form section
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Add a visual indicator to help users see where to select dates
      const datePickerEl = bookingFormRef.current.querySelector('.date-picker-container');
      if (datePickerEl) {
        datePickerEl.classList.add('highlight-pulse');
        setTimeout(() => {
          datePickerEl.classList.remove('highlight-pulse');
        }, 2000);
      }
      return;
    }

    // The code below will only run if scrolling fails for some reason
    if (!user) {
      setLocation(`/auth?redirect=/cruises/${id}`);
      return;
    }

    if (!startDate || !selectedCabinType) {
      return;
    }

    // Calculate end date based on cruise duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (cruise?.duration || 0));

    setLocation(`/checkout/cruise/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}&cabinType=${selectedCabinType}`);
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

  // Safely parse JSON strings with fallbacks
  const safeJsonParse = (jsonString: string | null, defaultValue: any = null) => {
    if (!jsonString) return defaultValue;
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check if the result is valid for objects (should be an object and not empty array)
      if (!Array.isArray(defaultValue) && (typeof parsed !== 'object' || parsed === null)) {
        return defaultValue;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error parsing JSON: ${error}`);
      return defaultValue;
    }
  };

  const itinerary = getItinerary();

  // Fetch cabin types from API
  const { 
    data: cabinTypes = [],
    isLoading: isLoadingCabinTypes
  } = useQuery<CruiseCabinType[]>({
    queryKey: [`/api/cruises/${id}/cabin-types`],
    enabled: !!id,
  });
  
  // Fallback cabin types if none are found in the database
  const fallbackCabinTypes = [
    {
      id: 0,
      cruiseId: parseInt(id || "0"),
      name: "Interior Cabin",
      image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1470&auto=format&fit=crop",
      description: "Affordable and comfortable interior cabins with no window, perfect for budget-conscious travelers.",
      features: '["Queen-size bed or twin beds", "Private bathroom", "TV", "Mini refrigerator"]',
      price: cruise?.price || 0,
      availability: 8,
      capacity: 2,
      featured: false,
      active: true,
      createdAt: new Date(),
    },
    {
      id: 0,
      cruiseId: parseInt(id || "0"),
      name: "Ocean View Cabin",
      image: "https://images.unsplash.com/photo-1616394158624-the29065ff11c?q=80&w=1470&auto=format&fit=crop",
      description: "Comfortable cabins with a window or porthole offering beautiful ocean views.",
      features: '["Ocean view window", "Queen-size bed", "Private bathroom", "TV", "Mini refrigerator"]',
      price: cruise ? Math.round(cruise.price * 1.3) : 0,
      availability: 5,
      capacity: 2,
      featured: false,
      active: true,
      createdAt: new Date(),
    },
    {
      id: 0,
      cruiseId: parseInt(id || "0"),
      name: "Balcony Cabin",
      image: "https://images.unsplash.com/photo-1616394158732-95cfc48fc350?q=80&w=1470&auto=format&fit=crop",
      description: "Spacious cabins featuring a private balcony for you to enjoy the ocean breeze and views.",
      features: '["Private balcony", "Queen-size bed", "Sitting area", "Private bathroom", "TV", "Mini bar"]',
      price: cruise ? Math.round(cruise.price * 1.6) : 0,
      availability: 3,
      capacity: 2,
      featured: true,
      active: true,
      createdAt: new Date(),
    }
  ];

  // Route/ports of call (example data)
  const ports = [
    { day: 1, port: "Miami, Florida", arrival: "", departure: "16:00", isEmbarkation: true },
    { day: 2, port: "At Sea", arrival: "", departure: "", isSea: true },
    { day: 3, port: "Nassau, Bahamas", arrival: "08:00", departure: "17:00" },
    { day: 4, port: "CocoCay, Bahamas", arrival: "08:00", departure: "17:00" },
    { day: 5, port: "At Sea", arrival: "", departure: "", isSea: true },
    { day: 6, port: "Miami, Florida", arrival: "07:00", departure: "", isDisembarkation: true }
  ];

  // Ship details (example data)
  const shipDetails = {
    name: cruise?.company || "Royal Caribbean",
    yearBuilt: "2015",
    capacity: "4,000 guests",
    crew: "1,500 crew members",
    tonnage: "168,000 tons",
    length: "1,188 feet"
  };

  // Onboard experience categories
  const onboardExperience = [
    {
      category: "Dining",
      description: "Experience world-class cuisine in a variety of dining venues, from casual to fine dining.",
      options: ["Main Dining Room", "Specialty Restaurants", "Buffet", "Casual Dining", "24-hour Room Service"]
    },
    {
      category: "Entertainment",
      description: "Enjoy Broadway-style shows, live music, comedy, and more throughout your cruise.",
      options: ["Theater Shows", "Live Music", "Comedy Club", "Casino", "Movie Nights"]
    },
    {
      category: "Activities",
      description: "Stay active and entertained with a variety of onboard activities for all ages.",
      options: ["Swimming Pools", "Waterslides", "Rock Climbing", "Mini Golf", "Sports Court"]
    },
    {
      category: "Relaxation",
      description: "Unwind and rejuvenate at our spa and wellness facilities.",
      options: ["Full-service Spa", "Fitness Center", "Adult-only Solarium", "Hot Tubs", "Meditation Classes"]
    }
  ];

  // Reviews data (example)
  const reviews = [
    {
      name: "Sarah J.",
      date: "October 2023",
      rating: 5,
      comment: "Absolutely amazing cruise experience! The staff were attentive, the food was delicious, and the entertainment was top-notch."
    },
    {
      name: "Michael T.",
      date: "September 2023",
      rating: 4,
      comment: "Great value for money. The ship was beautiful and the itinerary was perfect. Only downside was the crowded pool area."
    },
    {
      name: "Rebecca L.",
      date: "August 2023",
      rating: 5,
      comment: "This was our third cruise with this line and it did not disappoint. The balcony cabin was worth every penny!"
    }
  ];

  // Rating categories
  const ratingCategories = [
    { name: "Service", value: 4.8 },
    { name: "Cleanliness", value: 4.7 },
    { name: "Dining", value: 4.6 },
    { name: "Entertainment", value: 4.5 },
    { name: "Value", value: 4.4 }
  ];

  // FAQs
  const faqs = [
    {
      question: "What is included in my cruise fare?",
      answer: "Your cruise fare includes accommodations, meals in main dining venues, entertainment, and access to most onboard facilities. Additional costs include specialty restaurants, alcoholic beverages, shore excursions, spa treatments, and gratuities."
    },
    {
      question: "Do I need a passport?",
      answer: "Yes, a valid passport is required for all international cruises. For closed-loop cruises (beginning and ending at the same U.S. port), U.S. citizens may be able to travel with a birth certificate and government-issued photo ID, but a passport is still highly recommended."
    },
    {
      question: "What is the dress code?",
      answer: "Cruise attire varies by venue and time of day. Most days are casual, with resort wear appropriate for daytime activities. Evening dress codes range from casual to formal depending on the night. Specialty restaurants may require smart casual attire."
    },
    {
      question: "Is Wi-Fi available onboard?",
      answer: "Yes, Wi-Fi is available throughout the ship for an additional fee. Several internet packages are available to purchase based on your needs, from basic social media access to premium streaming capabilities."
    },
    {
      question: "What health and safety protocols are in place?",
      answer: "Our ships follow comprehensive health and safety protocols, including enhanced cleaning procedures, medical staff onboard, and compliance with all destination requirements. Specific protocols may vary based on current global health situations."
    }
  ];

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
      {/* Header Section */}
      <div className="bg-gradient-to-b from-blue-900/90 to-blue-800/90 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {cruise.featured && (
                  <Badge className="bg-secondary text-black">Luxury Cruise</Badge>
                )}
                <Badge className="bg-blue-600 text-white">
                  Limited Cabins Remaining
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                {cruise.name}
              </h1>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-blue-100 mb-4">
                <div className="flex items-center">
                  <ShipIcon className="w-4 h-4 mr-1.5" />
                  <span>{cruise.company}</span>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  <span>Departs from {cruise.departure}</span>
                </div>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span>{cruise.duration} Nights / {cruise.duration + 1} Days</span>
                </div>
              </div>

              {cruise.rating && (
                <div className="flex items-center mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(cruise.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-blue-300'} mr-0.5`} 
                      />
                    ))}
                  </div>
                  <span className="font-medium ml-2">{cruise.rating ? cruise.rating.toFixed(1) : '0.0'}</span>
                  {cruise.reviewCount && cruise.reviewCount > 0 && (
                    <span className="text-blue-200 text-sm ml-2">({cruise.reviewCount} reviews)</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="default"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
                <InquiryForm
                  productName={cruise.name}
                  defaultSubject={`Inquiry about ${cruise.name} cruise`}
                  triggerButtonText="Inquire Now"
                  triggerButtonFullWidth={false}
                  onInquirySubmitted={(conversationId) => {
                    setCurrentConversationId(conversationId);
                    setAutoOpenChat(true);
                  }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg text-center w-full md:w-auto">
              <div className="text-blue-100">Starting from</div>
              <div className="text-3xl md:text-4xl font-heading font-bold">{formatCurrency(cruise.price)}</div>
              <div className="text-blue-100 text-sm">per person</div>
              <Badge className="mt-2 bg-secondary text-black">Save 15% • Limited Offer</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Carousel */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="relative overflow-hidden rounded-xl h-[300px] md:h-[500px] group">
            {/* Render current image from gallery or primary image */}
            {cruise.imageGallery ? (
              // With gallery
              <img 
                src={currentImageIndex === 0 
                  ? cruise.imageUrl 
                  : safeJsonParse(cruise.imageGallery, [])[currentImageIndex - 1]}
                alt={`${cruise.name} - Image ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              // No gallery, just show main image
              <img 
                src={cruise.imageUrl} 
                alt={cruise.name} 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Gallery controls - Only shown if gallery exists */}
            {cruise.imageGallery && (
              <>
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-white/80 hover:bg-white"
                    onClick={() => {
                      const galleryLength = safeJsonParse(cruise.imageGallery, []).length + 1;
                      setCurrentImageIndex(prev => prev === 0 ? galleryLength - 1 : prev - 1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-white/80 hover:bg-white"
                    onClick={() => {
                      const galleryLength = safeJsonParse(cruise.imageGallery, []).length + 1;
                      setCurrentImageIndex(prev => (prev + 1) % galleryLength);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {/* Image count indicator - Only shown if gallery exists */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1}/{safeJsonParse(cruise.imageGallery, []).length + 1}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cruise Highlights Bar */}
      <div className="bg-blue-50 border-y border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Route</div>
              <div className="text-xs text-neutral-600">
                {cruise.departure} {/*→ Multiple Ports*/}
              </div>
            </div>

            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Duration</div>
              <div className="text-xs text-neutral-600">
                {cruise.duration} Nights / {cruise.duration + 1} Days
              </div>
            </div>

            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <Ship className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Ship</div>
              <div className="text-xs text-neutral-600">
                {cruise.company}
              </div>
            </div>

            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Guests</div>
              <div className="text-xs text-neutral-600">
                {shipDetails.capacity}
              </div>
            </div>

            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <BadgePercent className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-neutral-800">Best For</div>
              <div className="text-xs text-neutral-600">
                Families, Couples
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="w-full md:w-auto justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="cabins">Cabins</TabsTrigger>
                <TabsTrigger value="onboard">Onboard</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <h2 className="text-2xl font-heading font-bold mb-4">About This Cruise</h2>
                <p className="text-neutral-600 whitespace-pre-line mb-6">
                  {cruise.description}
                </p>

                {/* Ship details */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
                    <Ship className="w-5 h-5 text-primary mr-2" />
                    Ship Details
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-neutral-500">Ship Name</div>
                      <div className="font-medium">{cruise.company}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Year Built</div>
                      <div className="font-medium">{shipDetails.yearBuilt}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Guest Capacity</div>
                      <div className="font-medium">{shipDetails.capacity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Crew Size</div>
                      <div className="font-medium">{shipDetails.crew}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Tonnage</div>
                      <div className="font-medium">{shipDetails.tonnage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Length</div>
                      <div className="font-medium">{shipDetails.length}</div>
                    </div>
                  </div>
                </div>

                {/* What's Included/Excluded */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                      What's Included
                    </h3>

                    <ul className="space-y-3">
                      {["Accommodation in selected cabin category", 
                        "All meals in main dining venues", 
                        "Entertainment and shows", 
                        "Use of pools and fitness center",
                        "Kids club and youth programs",
                        "Port charges and taxes"].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCheck className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
                      <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      What's Not Included
                    </h3>

                    <ul className="space-y-3">
                      {["Flights to/from departure port", 
                        "Shore excursions", 
                        "Specialty dining", 
                        "Alcoholic beverages",
                        "Internet access",
                        "Spa treatments",
                        "Gratuities"].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <XCircle className="w-4 h-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* FAQs */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-xl font-heading font-bold mb-4">Frequently Asked Questions</h3>

                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, idx) => (
                      <AccordionItem key={idx} value={`faq-${idx}`}>
                        <AccordionTrigger className="text-left font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-neutral-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary" className="mt-6">
                <h2 className="text-2xl font-heading font-bold mb-4">Cruise Itinerary</h2>

                {/* Map placeholder */}
                <div className="bg-blue-50 rounded-lg h-[300px] flex items-center justify-center mb-6">
                  <div className="text-center text-neutral-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <div className="font-medium">Interactive Cruise Route Map</div>
                  </div>
                </div>

                {/* Port Schedule */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mb-6">
                    <thead className="bg-blue-50 text-neutral-700">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Day</th>
                        <th className="py-3 px-4 text-left font-medium">Port of Call</th>
                        <th className="py-3 px-4 text-left font-medium">Arrival</th>
                        <th className="py-3 px-4 text-left font-medium">Departure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ports.map((port, idx) => (
                        <tr key={idx} className={port.isSea ? "bg-neutral-50" : "bg-white"}>
                          <td className="py-4 px-4 font-medium">{port.day}</td>
                          <td className="py-4 px-4">
                            <div className="font-medium">{port.port}</div>
                            {port.isEmbarkation && (
                              <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">Embarkation</Badge>
                            )}
                            {port.isDisembarkation && (
                              <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-100">Disembarkation</Badge>
                            )}
                            {port.isSea && (
                              <div className="text-sm text-neutral-500 mt-1">Day at sea with onboard activities</div>
                            )}
                          </td>
                          <td className="py-4 px-4">{port.arrival || "—"}</td>
                          <td className="py-4 px-4">{port.departure || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Day by Day */}
                <h3 className="text-xl font-heading font-bold mb-4">Day-by-Day Experience</h3>
                <div className="space-y-4">
                  {Object.keys(itinerary).length > 0 ? (
                    Object.entries(itinerary).map(([day, description], index) => (
                      <div key={index} className="bg-white p-5 rounded-lg border">
                        <h4 className="font-heading font-semibold text-lg">{day}</h4>
                        <p className="text-neutral-600 mt-2">{String(description)}</p>
                      </div>
                    ))
                  ) : (
                    [...Array(cruise.duration + 1)].map((_, i) => (
                      <div key={i} className="bg-white p-5 rounded-lg border">
                        <h4 className="font-heading font-semibold text-lg">Day {i + 1}</h4>
                        {i === 0 && (
                          <p className="text-neutral-600 mt-2">
                            <span className="font-medium">Embarkation Day:</span> Board the {cruise.company} at {cruise.departure}. Check into your cabin, explore the ship, and attend the mandatory safety drill. In the evening, enjoy a welcome dinner as the ship sets sail.
                          </p>
                        )}
                        {i > 0 && i < cruise.duration && (
                          <p className="text-neutral-600 mt-2">
                            {i % 2 === 0 ? (
                              <>
                                <span className="font-medium">Port Day:</span> Arrive at a breathtaking destination. Explore on your own or join one of our curated shore excursions. Return to the ship for evening entertainment and dining.
                              </>
                            ) : (
                              <>
                                <span className="font-medium">Sea Day:</span> Enjoy a full day of onboard activities. Relax by the pool, participate in classes and games, indulge in spa treatments, or try your luck at the casino. Multiple dining options and evening shows are available.
                              </>
                            )}
                          </p>
                        )}
                        {i === cruise.duration && (
                          <p className="text-neutral-600 mt-2">
                            <span className="font-medium">Disembarkation Day:</span> After a final breakfast onboard, disembark at {cruise.departure}. Collect your luggage and transfer to your onward destination, taking wonderful memories with you.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Cabins Tab */}
              <TabsContent value="cabins" className="mt-6">
                <h2 className="text-2xl font-heading font-bold mb-4">Cabin Types & Pricing</h2>

                <div className="space-y-6">
                  {cabinTypes.map((cabin, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="h-48 md:h-full">
                          <img 
                            src={cabin.image} 
                            alt={cabin.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6 md:col-span-2">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-heading font-bold">{cabin.name}</h3>
                              <div className="text-neutral-500 text-sm">
                                {cabin.availability} cabins remaining
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-neutral-500">From</div>
                              <div className="text-xl font-heading font-bold text-primary">
                                {formatCurrency(cabin.price)}
                              </div>
                              <div className="text-sm text-neutral-500">per person</div>
                            </div>
                          </div>

                          <p className="text-neutral-600 mb-4">{cabin.description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {cabin.features.map((feature, i) => (
                              <div key={i} className="flex items-center">
                                <div className="rounded-full bg-primary/10 p-1 mr-2">
                                  <CheckCheck className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                              variant={selectedCabinType === cabin.name ? "default" : "outline"}
                              className={selectedCabinType === cabin.name ? "bg-primary" : ""}
                              onClick={() => setSelectedCabinType(cabin.name)}
                            >
                              Select Cabin
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Onboard Experience Tab */}
              <TabsContent value="onboard" className="mt-6">
                <h2 className="text-2xl font-heading font-bold mb-4">Onboard Experience</h2>

                <div className="space-y-6">
                  {onboardExperience.map((category, idx) => (
                    <div key={idx} className="bg-white rounded-lg border overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-5">
                        <div className="md:col-span-2 p-6 bg-blue-50">
                          <h3 className="text-xl font-heading font-bold mb-2">{category.category}</h3>
                          <p className="text-neutral-600">{category.description}</p>
                        </div>
                        <div className="md:col-span-3 p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {category.options.map((option, i) => (
                              <div key={i} className="flex items-start">
                                <div className="rounded-full bg-primary/10 p-1 mr-3 mt-0.5">
                                  <CheckCheck className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{option}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amenities Grid */}
                <h3 className="text-xl font-heading font-bold mt-8 mb-4">Ship Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Utensils className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Dining</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Multiple restaurants</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>24-hour room service</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Specialty dining options</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Wifi className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Connectivity</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Ship-wide Wi-Fi</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Internet café</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Mobile service at sea</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Entertainment</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Broadway-style shows</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Live music venues</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Nightclubs and lounges</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <HeartPulse className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Wellness</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Full-service spa</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Beauty salon</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Medical center</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Recreation</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Multiple swimming pools</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Fitness center</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Sports courts</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg border p-5">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-bold">Family</h4>
                    </div>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Kids and teens clubs</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Family activities</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCheck className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span>Babysitting services</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <h2 className="text-2xl font-heading font-bold mb-4">Guest Reviews</h2>

                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                      <div className="flex items-center mb-4">
                        <div className="text-4xl font-heading font-bold mr-4">{cruise.rating?.toFixed(1) || "4.6"}</div>
                        <div>
                          <div className="flex mb-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className={`w-5 h-5 ${i < Math.floor(cruise.rating || 4.6) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'} mr-0.5`} 
                              />
                            ))}
                          </div>
                          <div className="text-sm text-neutral-500">
                            Based on {cruise.reviewCount || 124} reviews
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ratingCategories.map((category, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{category.name}</span>
                              <span className="font-medium">{category.value}</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(category.value / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-heading font-bold">Traveler Experiences</h3>
                    </div>

                    <div className="space-y-6">
                      {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white rounded-lg border p-5">
                          <div className="flex justify-between mb-2">
                            <div className="font-heading font-bold">{review.name}</div>
                            <div className="text-sm text-neutral-500">{review.date}</div>
                          </div>

                          <div className="flex mb-3">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'} mr-0.5`} 
                              />
                            ))}
                          </div>

                          <p className="text-neutral-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking sidebar */}
          <div>
            <div className="sticky top-24">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-heading font-bold mb-4">Book This Cruise</h2>

                  <div className="space-y-4" ref={bookingFormRef}>
                    <div className="date-picker-container">
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
                            ({cruise.duration} nights cruise)
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Cabin Type</label>
                      <Select 
                        value={selectedCabinType || ""} 
                        onValueChange={setSelectedCabinType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cabin type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cabinTypes.map((cabin, idx) => (
                            <SelectItem key={idx} value={cabin.name}>
                              {cabin.name} - {formatCurrency(cabin.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                    {selectedCabinType && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>
                            {selectedCabinType} x {guests} {parseInt(guests) === 1 ? 'person' : 'people'}
                          </span>
                          <span>
                            {formatCurrency(
                              cabinTypes.find(c => c.name === selectedCabinType)?.price || cruise.price * parseInt(guests)
                            )}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-neutral-500">
                          <span>Taxes & Fees</span>
                          <span>{formatCurrency((cabinTypes.find(c => c.name === selectedCabinType)?.price || cruise.price) * 0.2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg pt-2">
                          <span>Total</span>
                          <span>
                            {formatCurrency(
                              (cabinTypes.find(c => c.name === selectedCabinType)?.price || cruise.price) * parseInt(guests) * 1.2
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full text-black" 
                      size="lg"
                      onClick={handleBookNow}
                      disabled={!startDate || !selectedCabinType}
                    >
                      Book Now
                    </Button>

                    <p className="text-xs text-neutral-500 text-center">
                      No payment required today - pay later available
                    </p>

                    <div className="flex items-center justify-center text-sm text-neutral-500 mt-2">
                      <BadgePercent className="w-4 h-4 mr-1" />
                      <span>Special group rates available</span>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-neutral-700 font-medium text-center mb-3">Have questions?</h4>
                      <InquiryForm
                        productName={cruise.name}
                        defaultSubject={`Inquiry about ${cruise.name} cruise`}
                        triggerButtonText="Contact Us"
                        triggerButtonFullWidth={true}
                        onInquirySubmitted={(conversationId) => {
                          setCurrentConversationId(conversationId);
                          setAutoOpenChat(true);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Cruises */}
        <div className="mt-12">
          <h2 className="text-2xl font-heading font-bold mb-6">You May Also Like</h2>

          {allCruises && cruise ? (
            (() => {
              // Filter cruises with the same departure port
              const similarCruises = allCruises.filter(c => 
                c.id !== parseInt(id as string) && 
                c.departure === cruise.departure
              ).slice(0, 3);

              if (similarCruises.length === 0) {
                return (
                  <div className="text-center py-8 bg-neutral-50 rounded-lg">
                    <Ship className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500">No similar cruises available from {cruise.departure}</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {similarCruises.map((similarCruise) => (
                    <Card key={similarCruise.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img 
                          src={similarCruise.imageUrl}
                          alt={similarCruise.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
                          {similarCruise.featured && (
                            <Badge className="bg-secondary text-white mb-1">Featured</Badge>
                          )}
                          <h3 className="font-heading font-bold">{similarCruise.name}</h3>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center text-sm text-neutral-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{similarCruise.duration} Nights</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-neutral-500">From</div>
                            <div className="font-heading font-bold text-primary">{formatCurrency(similarCruise.price)}</div>
                          </div>
                        </div>
                        <Link href={`/cruises/${similarCruise.id}`}>
                          <Button variant="outline" className="w-full mt-2">View Details</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="h-48 bg-neutral-100 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-neutral-100 animate-pulse mb-2" />
                    <div className="h-6 bg-neutral-100 animate-pulse mb-4 w-1/2" />
                    <div className="h-10 bg-neutral-100 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}