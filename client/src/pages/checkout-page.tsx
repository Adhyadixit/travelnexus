import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/page-container";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Hotel, Cab, Cruise, Event, Destination, insertBookingSchema } from "@shared/schema";
import CheckoutForm from "@/components/checkout/checkout-form";
import CheckoutSummary from "@/components/checkout/checkout-summary";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from 'react-helmet';

export default function CheckoutPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Parse the URL parameters - format: /checkout/:type/:id?queryParams
  const pathParts = location.split('/');
  const queryParams = location.split('?')[1] || '';
  const params = new URLSearchParams(queryParams);
  
  // Extract type and id from the path
  const itemType = pathParts.length > 2 ? pathParts[2] as "package" | "hotel" | "cab" | "cruise" | "event" : null;
  const itemId = pathParts.length > 3 ? parseInt(pathParts[3]) : null;
  
  // Extract booking details from URL parameters
  const startDateParam = params.get('startDate');
  const endDateParam = params.get('endDate');
  const guestsParam = params.get('guests');
  
  // Booking details state
  const [bookingDetails, setBookingDetails] = useState({
    startDate: startDateParam ? new Date(startDateParam) : new Date(),
    endDate: endDateParam ? new Date(endDateParam) : undefined as Date | undefined,
    numberOfPeople: guestsParam ? parseInt(guestsParam) : 1,
  });
  
  // Fetch the item based on type
  const { data: item, isLoading } = useQuery<Package | Hotel | Cab | Cruise | Event>({
    queryKey: [`/api/${itemType}s/${itemId}`],
    enabled: !!itemType && !!itemId,
  });
  
  // Fetch destination if needed
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
    enabled: !!item && ("destinationId" in item),
  });
  
  // Get destination name if applicable
  const destination = destinations.find(d => 
    item && "destinationId" in item && d.id === item.destinationId
  );
  
  // Setup booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const res = await apiRequest("POST", "/api/bookings", bookingData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
  });
  
  // If item type or id is missing, redirect to home
  useEffect(() => {
    if (!itemType || !itemId) {
      setLocation("/");
      toast({
        title: "Invalid Request",
        description: "Missing item information. Please try again.",
        variant: "destructive",
      });
    }
  }, [itemType, itemId, setLocation, toast]);
  
  // Handle booking submission
  const handleBookingSubmit = async (bookingData: any) => {
    if (!item || !itemType) return;
    
    setIsSubmitting(true);
    try {
      await bookingMutation.mutateAsync(bookingData);
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format title based on the item type
  const getPageTitle = () => {
    if (!itemType) return "Checkout";
    
    const typeTitles = {
      package: "Package",
      hotel: "Hotel",
      cab: "Private Driver",
      cruise: "Cruise",
      event: "Event",
    };
    
    return `Book ${typeTitles[itemType]}`;
  };
  
  // If loading, show loading state
  if (isLoading || !item) {
    return (
      <PageContainer>
        <div className="container mx-auto px-4 py-10">
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Helper function to type-check item properties
  const hasProperty = <T extends object, K extends string>(obj: T, prop: K): obj is T & Record<K, any> => {
    return prop in obj;
  };

  // Prepare item data for checkout
  const checkoutItem = {
    id: item.id,
    name: hasProperty(item, "name") ? item.name : 
          hasProperty(item, "driverName") ? item.driverName : "Unknown",
    price: hasProperty(item, "pricePerNight") ? item.pricePerNight : 
           hasProperty(item, "dailyRate") ? item.dailyRate : 
           hasProperty(item, "price") ? item.price : 0,
    image: hasProperty(item, "imageUrl") ? item.imageUrl : 
           hasProperty(item, "vehicleImageUrl") ? item.vehicleImageUrl : "",
    type: itemType || "package",  // Provide a safe default
    destination: destination?.name,
    duration: hasProperty(item, "duration") ? item.duration : undefined,
    rating: hasProperty(item, "rating") ? item.rating : undefined,
  } as const;

  return (
    <PageContainer>
      <Helmet>
        <title>Checkout | TravelEase</title>
        <meta name="description" content="Complete your booking with TravelEase. Secure checkout process for your travel reservations." />
        <meta property="og:title" content="Checkout | TravelEase" />
        <meta property="og:description" content="Finalize your travel booking with our secure checkout process." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-10">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 flex items-center"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">{getPageTitle()}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CheckoutForm
              item={checkoutItem}
              onSubmit={handleBookingSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
          
          <div>
            <CheckoutSummary
              item={checkoutItem}
              bookingDetails={bookingDetails}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
