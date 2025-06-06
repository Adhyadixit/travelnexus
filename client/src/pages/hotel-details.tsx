import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Hotel, Destination } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseAmenities, parseNearbyAttractions } from "@/lib/utils";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { InquiryForm } from "@/components/inquiry-form";
import { SimpleRoomImageDisplay } from "@/components/rooms/simple-room-image-display";
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Heart, 
  HomeIcon, 
  Info, 
  Loader2,
  MapIcon, 
  MapPin, 
  MapPinIcon, 
  Maximize, 
  MessageCircle,
  Star, 
  User,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Briefcase,
  HelpCircle,
  ThumbsUp,
  Languages,
  Check
} from "lucide-react";
import { format } from "date-fns";

// Helper function to safely parse JSON
const safeJsonParse = (json: string | null | undefined, defaultValue: any = null) => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return defaultValue;
  }
};

// Define review data
const HOTEL_REVIEWS = [
  {
    id: 1,
    author: 'John D.',
    date: '2023-08-12',
    rating: 9.2,
    comment: 'Excellent stay! The staff was very friendly and the room was spotless. Great location too.',
    categories: {
      cleanliness: 9.5,
      location: 9.8,
      staff: 9.5,
      comfort: 9.0,
      value: 8.5,
      amenities: 9.0
    }
  },
  {
    id: 2,
    author: 'Sarah M.',
    date: '2023-07-28',
    rating: 8.7,
    comment: 'Great hotel with amazing views. The only downside was the noise from the street, but everything else was perfect.',
    categories: {
      cleanliness: 9.0,
      location: 8.5,
      staff: 9.0,
      comfort: 8.0,
      value: 8.5,
      amenities: 9.0
    }
  },
  {
    id: 3,
    author: 'Robert K.',
    date: '2023-07-15',
    rating: 9.5,
    comment: 'One of the best hotels I\'ve stayed at. The breakfast was exceptional and the spa facilities were top-notch.',
    categories: {
      cleanliness: 9.5,
      location: 9.5,
      staff: 10.0,
      comfort: 9.5,
      value: 9.0,
      amenities: 9.5
    }
  }
];

// Define FAQ data
const HOTEL_FAQS = [
  {
    question: 'Is breakfast included in the room rate?',
    answer: 'Yes, all room rates include our signature breakfast buffet served from 6:30 AM to 10:30 AM daily.'
  },
  {
    question: 'What time is check-in and check-out?',
    answer: 'Check-in is at 3:00 PM and check-out is at 12:00 PM. Early check-in and late check-out may be available upon request, subject to availability.'
  },
  {
    question: 'Is there parking available at the hotel?',
    answer: 'Yes, we offer both valet parking and self-parking options. Valet parking is $25 per day and self-parking is $18 per day.'
  },
  {
    question: 'Do you offer airport shuttle service?',
    answer: 'Yes, we provide complimentary airport shuttle service. Please contact the hotel at least 24 hours in advance to arrange pickup.'
  },
  {
    question: 'Is the hotel pet-friendly?',
    answer: 'Yes, we welcome pets under 25 pounds. There is a non-refundable pet fee of $75 per stay.'
  }
];

// Icons mapping for amenities
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "Free WiFi": <Wifi className="w-5 h-5" />,
  "Parking": <Car className="w-5 h-5" />,
  "Breakfast": <Coffee className="w-5 h-5" />,
  "Swimming Pool": <Dumbbell className="w-5 h-5" />,
  "Fitness Center": <Dumbbell className="w-5 h-5" />,
  "Airport Shuttle": <Briefcase className="w-5 h-5" />,
};

export default function HotelDetails() {
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
  const [endDate, setEndDate] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const { toast } = useToast();

  // Fetch hotel details
  const { 
    data: hotel,
    isLoading: isHotelLoading
  } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`],
  });

  // Fetch destination details (for breadcrumbs)
  const { 
    data: destination,
    isLoading: isDestinationLoading 
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${hotel?.destinationId}`],
    enabled: !!hotel?.destinationId,
  });

  // Fetch similar hotels in the same destination
  const { 
    data: similarHotels, 
    isLoading: isLoadingSimilarHotels 
  } = useQuery<Hotel[]>({
    queryKey: [`/api/hotels`],
    select: (data) => data.filter(h => h.destinationId === hotel?.destinationId && h.id !== parseInt(id as string)),
    enabled: !!hotel?.destinationId,
  });
  
  // Fetch room types from database
  const {
    data: dbRoomTypes,
    isLoading: isLoadingRoomTypes
  } = useQuery<any[]>({
    queryKey: [`/api/hotels/${id}/room-types`],
    enabled: !!id
  });

  // Reference to the booking form section for scrolling
  const bookingFormRef = useRef<HTMLDivElement>(null);
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      setLocation(`/auth?redirect=/hotels/${id}`);
      return;
    }

    // Scroll to the booking form section
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth' });
      
      if (!selectedRoom) {
        // First scroll to room selection if no room is selected
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Highlight date picker if dates are not selected
      if (!startDate || !endDate) {
        // Add a visual indicator to help users see what they need to complete
        const datePickerContainer = bookingFormRef.current.querySelector('.date-picker-container');
        if (datePickerContainer) {
          datePickerContainer.classList.add('highlight-pulse');
          setTimeout(() => {
            datePickerContainer.classList.remove('highlight-pulse');
          }, 2000);
        }
        return;
      }
    }

    // Proceed to checkout if all required fields are filled
    if (startDate && endDate && selectedRoom) {
      setLocation(`/checkout/hotel/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=${guests}&roomType=${selectedRoom}`);
    }
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
    const roomPrice = selectedRoom && dbRoomTypes 
      ? dbRoomTypes.find(r => r.id === selectedRoom)?.price || 0 
      : 0;
    return nights * roomPrice;
  };

  const nights = calculateNights();
  const totalPrice = calculateTotalPrice();

  // For image gallery navigation
  const handlePrevImage = () => {
    // If there's only one image, do nothing
    if (galleryImages.length <= 1) return;
    
    setActiveImageIndex((prevIndex) => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    // If there's only one image, do nothing
    if (galleryImages.length <= 1) return;
    
    setActiveImageIndex((prevIndex) => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Check if loading
  const isLoading = isHotelLoading || (hotel?.destinationId && isDestinationLoading);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs skeleton */}
          <div className="flex mb-4 space-x-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Header section skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <div className="flex space-x-2 mb-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>

          {/* Gallery skeleton */}
          <div className="grid grid-cols-12 gap-2 mb-6">
            <Skeleton className="col-span-8 h-96 rounded-xl" />
            <div className="col-span-4 grid grid-rows-2 gap-2">
              <Skeleton className="h-full rounded-xl" />
              <Skeleton className="h-full rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main content skeleton */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>

            {/* Booking sidebar skeleton */}
            <div>
              <Skeleton className="h-[500px] w-full rounded-xl" />
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

  // Build a gallery from hotel image and any additional images
  const mainImage = hotel.imageUrl;
  
  // Parse gallery images safely
  let parsedGalleryImages: string[] = [];
  if (hotel.imageGallery) {
    try {
      const parsed = JSON.parse(hotel.imageGallery);
      
      // Handle different possible formats
      if (Array.isArray(parsed)) {
        parsedGalleryImages = parsed.filter((img: any) => 
          typeof img === 'string' && img && img.trim() !== ''
        );
      } else if (typeof parsed === 'string' && parsed.trim() !== '') {
        parsedGalleryImages = [parsed];
      } else if (parsed && typeof parsed === 'object') {
        // Handle case where it might be an object with URLs
        const values = Object.values(parsed);
        parsedGalleryImages = values
          .filter((val: any): val is string => typeof val === 'string' && val.trim() !== '');
      }
    } catch (e) {
      console.error("Error parsing hotel gallery images:", e);
      // If parsing fails but we have a string, try to use it directly
      if (typeof hotel.imageGallery === 'string' && 
          hotel.imageGallery.trim() !== '' && 
          !hotel.imageGallery.startsWith('[') && 
          !hotel.imageGallery.startsWith('{')) {
        parsedGalleryImages = [hotel.imageGallery];
      }
    }
  }
  
  // Create final gallery array - if no additional images, just use main image
  // Make sure we don't duplicate the main image
  const uniqueGalleryImages = parsedGalleryImages.filter(img => img !== mainImage);
  const galleryImages = uniqueGalleryImages.length > 0 
    ? [mainImage, ...uniqueGalleryImages] 
    : [mainImage];

  // Get current image
  const currentImage = galleryImages[activeImageIndex];

  // Calculate average rating from reviews
  const averageRating = HOTEL_REVIEWS.reduce((acc, review) => acc + review.rating, 0) / HOTEL_REVIEWS.length;

  // Format check-in/check-out times or use defaults
  const checkInTime = hotel.checkIn || '3:00 PM';
  const checkOutTime = hotel.checkOut || '12:00 PM';

  // Parse hotel data fields that contain JSON
  const hotelRoomTypes = hotel?.roomTypes 
    ? safeJsonParse(hotel.roomTypes, []) 
    : [];

  // Parse nearby attractions or use empty array
  const nearbyAttractions = hotel?.nearbyAttractions 
    ? safeJsonParse(hotel.nearbyAttractions, []) 
    : [];

  // Parse languages spoken by staff
  let languages: string[] = ['English'];
  if (hotel.languagesSpoken) {
    try {
      const parsed = JSON.parse(hotel.languagesSpoken);
      languages = Array.isArray(parsed) ? parsed : [parsed.toString()];
    } catch (e) {
      console.error("Error parsing languagesSpoken:", e);
      // If parsing fails, use the string value directly if it exists
      if (typeof hotel.languagesSpoken === 'string' && hotel.languagesSpoken.trim() !== '') {
        languages = [hotel.languagesSpoken.trim()];
      }
    }
  }

  // Parse hotel policies
  const policies = hotel.policies 
    ? JSON.parse(hotel.policies) 
    : {
        smoking: 'Non-smoking throughout',
        pets: 'Pets allowed (charges may apply)',
        children: 'Children of all ages welcome',
        extraBeds: 'Extra beds available for $50 per night'
      };



  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-neutral-600 mb-4">
          <Link href="/">
            <a className="flex items-center hover:text-primary">
              <HomeIcon className="w-4 h-4 mr-1" />
              <span>Home</span>
            </a>
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/hotels">
            <a className="hover:text-primary">Hotels</a>
          </Link>
          {destination && (
            <>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link href={`/destinations/${destination.id}`}>
                <a className="hover:text-primary">{destination.name}</a>
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="font-medium text-neutral-900">{hotel.name}</span>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-heading font-bold">{hotel.name}</h1>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleBookNow}
            >
              Book Now
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex mr-4">
              {[...Array(hotel.rating)].map((_, i) => (
                <Star key={i} className="text-yellow-400 w-5 h-5 fill-current" />
              ))}
            </div>
            {hotel.userRating && (
              <div className="bg-primary text-white px-2 py-1 rounded-md font-medium flex items-center mr-4">
                <span>{hotel.userRating.toFixed(1)}</span>
                <span className="text-xs ml-1">/10</span>
              </div>
            )}
            {typeof hotel.reviewCount === 'number' && hotel.reviewCount > 0 && (
                <div className="text-neutral-600">
                  {hotel.reviewCount} reviews
                </div>
              )}
          </div>
          <div className="flex items-center text-neutral-600">
            <MapPinIcon className="w-5 h-5 mr-1" />
            <span>{hotel.address}</span>
          </div>
        </div>

        {/* Image Gallery Section */}
        <div className="grid grid-cols-12 gap-2 mb-6 relative">
          {/* Main large image with enhanced mobile support */}
          <div className="col-span-12 md:col-span-8 relative overflow-hidden rounded-xl mobile-gallery">
            <div 
              className="w-full mobile-slider touch-pan-x" 
              style={{ 
                overflowX: isMobile ? 'auto' : 'hidden',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <img 
                src={currentImage} 
                alt={`${hotel.name} - Image ${activeImageIndex + 1}`} 
                className="w-full h-96 object-cover cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              />
            </div>
            
            <button 
              className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-md text-neutral-700 hover:text-primary transition-colors z-10"
              onClick={() => setIsLightboxOpen(true)}
            >
              <Maximize className="w-5 h-5" />
            </button>

            {/* Image navigation arrows - larger on mobile - only show when multiple images */}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-2 rounded-full text-neutral-700 hover:text-primary transition-colors z-10 shadow-md carousel-arrow"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  style={{ width: isMobile ? '40px' : '32px', height: isMobile ? '40px' : '32px' }}
                >
                  <ChevronLeft className={isMobile ? "w-6 h-6" : "w-5 h-5"} />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-2 rounded-full text-neutral-700 hover:text-primary transition-colors z-10 shadow-md carousel-arrow"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  style={{ width: isMobile ? '40px' : '32px', height: isMobile ? '40px' : '32px' }}
                >
                  <ChevronRight className={isMobile ? "w-6 h-6" : "w-5 h-5"} />
                </button>
              </>
            )}
          </div>

          {/* Smaller thumbnail images - shown only on desktop when multiple images exist */}
          {galleryImages.length > 1 && (
            <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-2">
              {galleryImages.slice(1, Math.min(3, galleryImages.length)).map((img, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl">
                  <img 
                    src={img} 
                    alt={`${hotel.name} - Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setActiveImageIndex(idx + 1);
                      setIsLightboxOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Image counter indicator - only show when multiple images */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full z-10 backdrop-blur-sm">
              {activeImageIndex + 1} / {galleryImages.length}
            </div>
          )}
          
          {/* Mobile dot indicators - only show when multiple images */}
          {isMobile && galleryImages.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
              <div className="mobile-gallery-dots">
                {galleryImages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`mobile-gallery-dot ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Info Bar */}
        <div className="flex flex-wrap justify-between items-center p-4 bg-neutral-50 rounded-lg mb-8">
          <div>
            <div className="text-lg font-medium">From {formatCurrency(hotel.price)}</div>
            <div className="text-sm text-neutral-600">per night</div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Now
            </Button>
            <InquiryForm
              productName={hotel.name}
              defaultSubject={`Inquiry about ${hotel.name}`}
              triggerButtonText="Inquire Now"
              onInquirySubmitted={(conversationId) => {
                setCurrentConversationId(conversationId);
                setAutoOpenChat(true);
              }}
            />
          </div>
          <button
            className={`p-2 rounded-full border ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-neutral-200 text-neutral-400'}`}
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>

          {/* Free cancellation badge if applicable */}
          {hotel.freeCancellation && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-4">
              Free cancellation
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Detailed Description Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-4">About This Property</h2>
              <div className="prose max-w-none text-neutral-700">
                <p className="whitespace-pre-line">{hotel.description}</p>

                {/* Check-in/Check-out times */}
                <div className="flex flex-col md:flex-row gap-6 my-6">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-neutral-900">Check-in Time</h4>
                      <p className="text-neutral-600">{checkInTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-neutral-900">Check-out Time</h4>
                      <p className="text-neutral-600">{checkOutTime}</p>
                    </div>
                  </div>
                </div>

                {/* Hotel Policies */}
                <div className="mb-6">
                  <h3 className="text-xl font-heading font-bold mb-3">Hotel Policies</h3>
                  <ul className="space-y-2">
                    {Object.entries(policies).map(([key, value]) => (
                      <li key={key} className="flex items-start">
                        <Info className="w-4 h-4 text-neutral-500 mr-2 mt-0.5" />
                        <span><span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Languages Spoken */}
                <div>
                  <h3 className="text-xl font-heading font-bold mb-3">Languages Spoken</h3>
                  <div className="flex items-center mb-6">
                    <Languages className="w-5 h-5 text-primary mr-2" />
                    <div className="flex flex-wrap gap-2">
                      {languages.map((language: string) => (
                        <Badge key={language} variant="outline" className="bg-neutral-50">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nearby Attractions */}
                {nearbyAttractions.length > 0 && (
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-3">Nearby Places of Interest</h3>
                    <ul className="space-y-2">
                      {nearbyAttractions.map((attraction: {name: string, distance: string}, index: number) => (
                        <li key={index} className="flex items-start">
                          <MapPin className="w-4 h-4 text-primary mr-2 mt-0.5" />
                          <span>{attraction.name} - {attraction.distance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Room Types & Booking Options Section */}
            <section id="booking-section" className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Available Rooms</h2>

              {isLoadingRoomTypes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : dbRoomTypes && dbRoomTypes.length > 0 ? (
                <div className="space-y-6">
                  {dbRoomTypes.map((room: any) => (
                    <Card key={room.id} className={`overflow-hidden ${selectedRoom === room.id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="md:col-span-1">
                          {room.id === 1 ? (
                            <SimpleRoomImageDisplay
                              roomId={room.id}
                              roomName={room.name}
                              fallbackImage={hotel.imageUrl}
                            />
                          ) : (
                            <img 
                              src={room.imageUrl || hotel.imageUrl} 
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-4 md:col-span-3">
                          <div className="flex justify-between">
                            <h3 className="text-xl font-heading font-bold">{room.name}</h3>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{formatCurrency(room.price)}</div>
                              <div className="text-sm text-neutral-500">per night</div>
                            </div>
                          </div>

                          <p className="text-neutral-600 my-2">{room.description}</p>

                          <div className="flex items-center text-neutral-600 mb-2">
                            <User className="w-4 h-4 mr-1" />
                            <span>Up to {room.capacity || 2} guests</span>
                          </div>

                          {room.amenities && (
                            <div className="grid grid-cols-2 gap-2 my-3">
                              {safeJsonParse(room.amenities, []).map((amenity: string, index: number) => (
                                <div key={index} className="flex items-center text-sm">
                                  {AMENITY_ICONS[amenity] || <Check className="w-4 h-4 text-primary mr-1" />}
                                  <span className="ml-1">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {room.cancellationPolicy && (
                            <div className="text-sm text-green-600 flex items-center mb-4">
                              <Check className="w-4 h-4 mr-1" />
                              <span>{room.cancellationPolicy}</span>
                            </div>
                          )}

                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant={selectedRoom === room.id ? "default" : "outline"}
                              onClick={() => {
                                setSelectedRoom(room.id);
                                // If room is selected, scroll to the booking form for date selection
                                if (bookingFormRef.current) {
                                  setTimeout(() => {
                                    const formRef = bookingFormRef.current;
                                    formRef?.scrollIntoView({ behavior: 'smooth' });
                                    
                                    // Highlight date picker to guide user to next step
                                    if (!startDate && formRef) {
                                      const datePickerContainer = formRef.querySelector('.date-picker-container');
                                      if (datePickerContainer) {
                                        datePickerContainer.classList.add('highlight-pulse');
                                        setTimeout(() => {
                                          datePickerContainer.classList.remove('highlight-pulse');
                                        }, 2000);
                                      }
                                    }
                                  }, 100);
                                }
                              }}
                            >
                              {selectedRoom === room.id ? "Selected" : "Select Room"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-600">No room types available for this hotel.</p>
                </div>
              )}
            </section>

            {/* Amenities Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Amenities</h2>

              {amenitiesList && amenitiesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-3">General</h3>
                    <ul className="space-y-2">
                      {amenitiesList
                        .filter(a => 
                          !a.includes('WiFi') && 
                          !a.includes('Wi-Fi') && 
                          !a.includes('Internet') && 
                          !a.includes('Parking') && 
                          !a.includes('TV') && 
                          !a.includes('Air') && 
                          !a.includes('Mini')
                        )
                        .map((amenity: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <Check className="text-primary w-5 h-5 mr-2" />
                            <span>{amenity}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">Room Amenities</h3>
                    <ul className="space-y-2">
                      {amenitiesList
                        .filter(a => a.includes('TV') || a.includes('Air') || a.includes('Mini'))
                        .map((amenity: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <Check className="text-primary w-5 h-5 mr-2" />
                            <span>{amenity}</span>
                          </li>
                        ))}
                        {/* Add a default item if none match the filter criteria */}
                        {amenitiesList.filter(a => a.includes('TV') || a.includes('Air') || a.includes('Mini')).length === 0 && (
                          <li className="flex items-center">
                            <Check className="text-primary w-5 h-5 mr-2" />
                            <span>Standard Room Amenities</span>
                          </li>
                        )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">Internet & Parking</h3>
                    <ul className="space-y-2">
                      {amenitiesList
                        .filter(a => a.includes('WiFi') || a.includes('Wi-Fi') || a.includes('Internet') || a.includes('Parking'))
                        .map((amenity: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <Check className="text-primary w-5 h-5 mr-2" />
                            <span>{amenity}</span>
                          </li>
                        ))}
                        {/* Add Free WiFi if no internet options are present */}
                        {amenitiesList.filter(a => a.includes('WiFi') || a.includes('Wi-Fi') || a.includes('Internet')).length === 0 && (
                          <li className="flex items-center">
                            <Check className="text-primary w-5 h-5 mr-2" />
                            <span>Free WiFi</span>
                          </li>
                        )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-neutral-50">
                  <p className="text-center text-neutral-600">Amenities information not available</p>
                </div>
              )}
            </section>
            
            {/* Nearby Attractions Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Nearby Attractions</h2>
              
              {hotel?.nearbyAttractions && hotel.nearbyAttractions !== "{}" && hotel.nearbyAttractions !== "null" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    console.log("Hotel details - Displaying attractions:", hotel.nearbyAttractions);
                    const attractions = parseNearbyAttractions(hotel.nearbyAttractions);
                    console.log("Hotel details - Parsed attractions:", attractions);
                    
                    return attractions.map((attraction: string, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-primary mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium">{attraction}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-neutral-50">
                  <p className="text-center text-neutral-600">
                    Information about nearby attractions coming soon
                  </p>
                </div>
              )}
            </section>

            {/* Guest Reviews Section */}
            <section className="mb-10">
              <ReviewsSection itemType="hotel" itemId={parseInt(id)} />
            </section>



            {/* FAQ Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Frequently Asked Questions</h2>

              <div className="space-y-4">
                {HOTEL_FAQS.map((faq, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start">
                      <HelpCircle className="w-5 h-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-bold mb-1">{faq.question}</h4>
                        <p className="text-neutral-600">{faq.answer}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Similar Hotels in the Same Destination */}
            <section>
              <h2 className="text-2xl font-heading font-bold mb-6">You May Also Like</h2>

              {hotel.destinationId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isLoadingSimilarHotels ? (
                    // Loading skeletons
                    [...Array(3)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-[4/3] bg-neutral-200 animate-pulse"></div>
                        <CardContent className="p-4">
                          <div className="h-6 bg-neutral-200 animate-pulse rounded mb-2"></div>
                          <div className="h-4 bg-neutral-200 animate-pulse rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-neutral-200 animate-pulse rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Actual similar hotels
                    similarHotels?.filter(h => h.id !== parseInt(id)).slice(0, 3).map((similarHotel) => (
                      <Card key={similarHotel.id} className="overflow-hidden">
                        <Link to={`/hotels/${similarHotel.id}`}>
                          <div className="aspect-[4/3] overflow-hidden">
                            <img 
                              src={similarHotel.imageUrl}
                              alt={similarHotel.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link to={`/hotels/${similarHotel.id}`}>
                            <h3 className="font-bold text-lg mb-1 hover:text-primary transition-colors">{similarHotel.name}</h3>
                          </Link>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < similarHotel.rating ? "text-yellow-400 fill-current" : "text-neutral-300"
                                }`} 
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-neutral-600">{destination?.name}</div>
                            <div className="font-bold">{formatCurrency(similarHotel.price)}</div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Link to={`/hotels/${similarHotel.id}`} className="w-full">
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {similarHotels?.length === 0 && (
                <div className="text-center p-8 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-600">No similar hotels found in this destination.</p>
                </div>
              )}
            </section>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4" ref={bookingFormRef}>
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Book Your Stay</h2>

                <div className="space-y-4">
                  <div className="room-selector-container">
                    <label className="block text-sm font-medium mb-2">Room Type</label>
                    <Select 
                      value={selectedRoom?.toString() || ""} 
                      onValueChange={(value) => setSelectedRoom(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent className="text-neutral-800">
                        {dbRoomTypes && dbRoomTypes.length > 0 ? (
                          dbRoomTypes.map((room: any) => (
                            <SelectItem key={room.id} value={room.id.toString()} className="text-neutral-800">
                              {room.name} - {formatCurrency(room.price)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-rooms" disabled>No rooms available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Room Image Carousel */}
                  {selectedRoom && dbRoomTypes && (
                    <div className="mt-4 mb-4 h-48 rounded-lg overflow-hidden border bg-neutral-50">
                      <h3 className="p-2 text-center text-sm">Room: {dbRoomTypes.find((r: any) => r.id === selectedRoom)?.name || "Room"}</h3>
                      <SimpleRoomImageDisplay
                        roomId={selectedRoom}
                        roomName={dbRoomTypes.find((r: any) => r.id === selectedRoom)?.name || "Room"}
                        fallbackImage={hotel?.imageUrl || "https://placehold.co/400x300?text=No+Image"}
                      />
                    </div>
                  )}

                  <div className="date-picker-container">
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
                      <PopoverContent className="w-auto p-0 text-neutral-800" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="text-neutral-800"
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
                      <PopoverContent className="w-auto p-0 text-neutral-800" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            date < (startDate || new Date())
                          }
                          initialFocus
                          className="text-neutral-800"
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
                      <SelectContent className="text-neutral-800">
                        <SelectItem value="1" className="text-neutral-800">1 Guest</SelectItem>
                        <SelectItem value="2" className="text-neutral-800">2 Guests</SelectItem>
                        <SelectItem value="3" className="text-neutral-800">3 Guests</SelectItem>
                        <SelectItem value="4" className="text-neutral-800">4 Guests</SelectItem>
                        <SelectItem value="5" className="text-neutral-800">5 Guests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {nights > 0 && selectedRoom && dbRoomTypes && (
                    <div className="bg-neutral-50 p-4 rounded-lg space-y-2 mt-6">
                      <div className="flex justify-between">
                        <span>Room </span>
                        <span>{dbRoomTypes.find((r: any) => r.id === selectedRoom)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{formatCurrency(dbRoomTypes.find((r: any) => r.id === selectedRoom)?.price || 0)} x {nights} nights</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!startDate || !endDate || !selectedRoom}
                  >
                    Book Now
                  </Button>

                  {hotel.freeCancellation && (
                    <div className="text-sm text-green-600 flex items-center justify-center mt-2">
                      <Check className="w-4 h-4 mr-1" />
                      <span>Free cancellation available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}