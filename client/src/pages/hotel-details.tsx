import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Hotel, Destination, HotelRoomType } from "@shared/schema";
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
import { formatCurrency, parseAmenities } from "@/lib/utils";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { InquiryForm } from "@/components/inquiry-form";
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

// No more hardcoded room types - all will be fetched from the API

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
  
  // Fetch room types from the API
  const {
    data: roomTypes = [],
    isLoading: isRoomTypesLoading
  } = useQuery<HotelRoomType[]>({
    queryKey: [`/api/hotels/${id}/room-types`],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/${id}/room-types`);
      return res.json();
    },
    enabled: !!id,
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
    const roomPrice = selectedRoom ? roomTypes.find((r: HotelRoomType) => r.id === selectedRoom)?.price || 0 : 0;
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

  // Parse nearby attractions or use empty array
  const nearbyAttractions = hotel.nearbyAttractions 
    ? JSON.parse(hotel.nearbyAttractions) 
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
            <span className="flex items-center hover:text-primary">
              <HomeIcon className="w-4 h-4 mr-1" />
              <span>Home</span>
            </span>
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/hotels">
            <span className="hover:text-primary">Hotels</span>
          </Link>
          {destination && (
            <>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link href={`/destinations/${destination.id}`}>
                <span className="hover:text-primary">{destination.name}</span>
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-neutral-800 font-medium">{hotel.name}</span>
        </div>

        {/* Hotel Name and Rating */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">{hotel.name}</h1>
            <button 
              className="text-neutral-400 hover:text-red-500 transition-colors p-2"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating / 2) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`} />
            ))}
            <span className="ml-2 text-sm font-medium">{averageRating.toFixed(1)}/10</span>
            <span className="ml-1 text-sm text-neutral-500">({HOTEL_REVIEWS.length} reviews)</span>
          </div>
          
          <div className="flex items-center text-neutral-600">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{hotel.address || `${destination?.name}, ${destination?.country}`}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* Main large image */}
            <div className="md:col-span-8 relative rounded-lg overflow-hidden group">
              <img 
                src={currentImage} 
                alt={hotel.name}
                className="w-full object-cover h-[300px] md:h-[500px]"
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <button 
                  className="bg-white p-2 rounded-full"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="View full-size image"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
              
              {/* Navigation arrows (only show if there are multiple images) */}
              {galleryImages.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-1 transition-all"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-1 transition-all"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail grid - show 2 or 3 more images in a column */}
            <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-2">
              {galleryImages.slice(1, 3).map((image, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden group cursor-pointer" onClick={() => setActiveImageIndex(index + 1)}>
                  <img 
                    src={image} 
                    alt={`${hotel.name} - image ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                </div>
              ))}
              
              {/* If there are more than 3 images, show a "+X more" overlay on the last thumbnail */}
              {galleryImages.length > 3 && (
                <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-2 py-1 text-sm rounded-tl">
                  +{galleryImages.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image lightbox */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-4xl p-1 bg-neutral-900">
            <div className="relative">
              <img 
                src={currentImage} 
                alt={hotel.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {galleryImages.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-1 transition-all"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-1 transition-all"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            
            {/* Quick Info Bar */}
            <div className="flex flex-wrap justify-between items-center p-4 bg-neutral-50 rounded-lg mb-8">
              <div className="flex items-center mr-6 mb-2 md:mb-0">
                <Clock className="w-5 h-5 text-primary mr-2" />
                <div>
                  <div className="text-sm text-neutral-500">Check-in</div>
                  <div className="font-medium">{checkInTime}</div>
                </div>
              </div>
              
              <div className="flex items-center mr-6 mb-2 md:mb-0">
                <Clock className="w-5 h-5 text-primary mr-2" />
                <div>
                  <div className="text-sm text-neutral-500">Check-out</div>
                  <div className="font-medium">{checkOutTime}</div>
                </div>
              </div>

              <Button 
                onClick={handleBookNow}
                className="mb-2 md:mb-0"
              >
                Book Now
              </Button>
              
              <InquiryForm 
                itemId={parseInt(id)}
                itemType="hotel"
                itemName={hotel.name}
                onSubmitSuccess={(conversationId) => {
                  setCurrentConversationId(conversationId);
                  setAutoOpenChat(true);

                  toast({
                    title: "Inquiry Sent!",
                    description: "We've received your inquiry and will get back to you shortly.",
                  });
                }}
                trigger={
                  <Button variant="outline" className="flex gap-2 items-center">
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire</span>
                  </Button>
                }
              />
            </div>
            
            {/* Description */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-4">Overview</h2>
              <div className="text-neutral-600 space-y-4 mb-6">
                <p>{hotel.description || 'Experience the ultimate in luxury at this world-class hotel, where exceptional service meets elegant design. Perfectly located for both business and leisure travelers, our hotel offers breathtaking views, spacious rooms, and a wide range of amenities to ensure your stay is comfortable and memorable.'}</p>
              </div>

              {/* Property highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amenitiesList.slice(0, 6).map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center">
                    {AMENITY_ICONS[amenity] || <Check className="w-5 h-5 text-primary mr-2" />}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Room Types & Booking Options Section */}
            <section id="booking-section" className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Available Rooms</h2>

              {isRoomTypesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : roomTypes.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg">
                  <p className="text-neutral-600">No room types are currently available for this hotel. Please check back later or contact customer service for assistance.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {roomTypes.map((room: HotelRoomType) => (
                    <Card key={room.id} className={`overflow-hidden ${selectedRoom === room.id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="md:col-span-1">
                          <img 
                            src={hotel?.imageUrl} 
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
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
                            <span>Up to {room.capacity} guests</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-3">
                            {room.amenities && parseAmenities(room.amenities).map((amenity: string, index: number) => (
                              <div key={index} className="flex items-center text-sm">
                                {AMENITY_ICONS[amenity] || <Check className="w-4 h-4 text-primary mr-1" />}
                                <span className="ml-1">{amenity}</span>
                              </div>
                            ))}
                          </div>

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
              )}
            </section>

            {/* Amenities Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Amenities</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8">
                <div>
                  <h3 className="text-lg font-bold mb-3">General</h3>
                  <ul className="space-y-2">
                    {amenitiesList.filter(a => !a.includes('Pool') && !a.includes('Fitness') && !a.includes('Spa')).slice(0, 6).map((amenity, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="w-4 h-4 text-primary mr-2" />
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-3">Activities</h3>
                  <ul className="space-y-2">
                    {amenitiesList.filter(a => a.includes('Pool') || a.includes('Fitness') || a.includes('Spa')).map((amenity, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="w-4 h-4 text-primary mr-2" />
                        <span>{amenity}</span>
                      </li>
                    ))}
                    {amenitiesList.filter(a => a.includes('Pool') || a.includes('Fitness') || a.includes('Spa')).length === 0 && (
                      <li className="text-neutral-500">No specific activities listed</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-3">Services</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Languages className="w-4 h-4 text-primary mr-2" />
                      <span>Staff speaks: {languages.join(', ')}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      <span>24-hour front desk</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      <span>Room service</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Policies Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Hotel Policies</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(policies).map(([key, value]) => (
                    <div key={key} className="flex">
                      <Info className="w-5 h-5 text-neutral-500 mr-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-neutral-600">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Nearby Attractions */}
            {nearbyAttractions.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-heading font-bold mb-6">Nearby Attractions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nearbyAttractions.map((attraction: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <MapPin className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg">{attraction.name}</h3>
                        <p className="text-neutral-600">{attraction.distance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <ReviewsSection 
              reviews={HOTEL_REVIEWS}
              averageRating={averageRating}
            />

            {/* FAQs */}
            <section className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                {HOTEL_FAQS.map((faq, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start">
                        <HelpCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold mb-2">{faq.question}</h3>
                          <p className="text-neutral-600">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Similar Hotels Section */}
            {similarHotels && similarHotels.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-heading font-bold mb-6">You May Also Like</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarHotels.slice(0, 4).map((similarHotel) => (
                    <Card key={similarHotel.id} className="overflow-hidden h-full">
                      <div className="relative h-48">
                        <img 
                          src={similarHotel.imageUrl} 
                          alt={similarHotel.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-white text-neutral-800">
                            From {formatCurrency(similarHotel.pricePerNight || 0)}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-bold mb-1">{similarHotel.name}</h3>
                        <div className="flex items-center mb-2">
                          <MapPin className="w-4 h-4 text-neutral-500 mr-1" />
                          <span className="text-sm text-neutral-500">{destination?.name}</span>
                        </div>
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{similarHotel.description}</p>
                        <div className="mt-auto">
                          <Link href={`/hotels/${similarHotel.id}`}>
                            <Button variant="outline" className="w-full">View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 overflow-hidden shadow-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">Book Your Stay</h3>
                
                <div ref={bookingFormRef} className="space-y-6">
                  {/* Date Picker */}
                  <div className="date-picker-container space-y-2">
                    <Label>Check-in / Check-out Dates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal h-10 w-full"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "PPP")
                            ) : (
                              <span className="text-neutral-400">Check-in</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => 
                              date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                              (endDate ? date >= endDate : false)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal h-10 w-full"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "PPP")
                            ) : (
                              <span className="text-neutral-400">Check-out</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => 
                              date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                              (startDate ? date <= startDate : false)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Guest Count */}
                  <div className="space-y-2">
                    <Label htmlFor="guests">Guests</Label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger id="guests">
                        <SelectValue placeholder="Select number of guests" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Guest</SelectItem>
                        <SelectItem value="2">2 Guests</SelectItem>
                        <SelectItem value="3">3 Guests</SelectItem>
                        <SelectItem value="4">4 Guests</SelectItem>
                        <SelectItem value="5">5 Guests</SelectItem>
                        <SelectItem value="6">6 Guests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Room Type Summary */}
                  {selectedRoom && (
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <h4 className="font-bold mb-4">Selected Room:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Room Type:</span>
                          <span>{roomTypes.find((r: any) => r.id === selectedRoom)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>{formatCurrency(roomTypes.find((r: any) => r.id === selectedRoom)?.price || 0)} x {nights} nights</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button 
                    className="w-full" 
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