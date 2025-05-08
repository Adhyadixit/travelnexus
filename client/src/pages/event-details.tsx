import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Event, Destination } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, Info } from "lucide-react";
import { format } from "date-fns";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // State for booking
  const [ticketCount, setTicketCount] = useState("1");
  
  // Fetch event details
  const { 
    data: event,
    isLoading: isLoadingEvent
  } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
  });
  
  // Fetch destination details if event has destinationId
  const {
    data: destination,
    isLoading: isLoadingDestination
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${event?.destinationId}`],
    enabled: !!event?.destinationId,
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      setLocation(`/auth?redirect=/events/${id}`);
      return;
    }
    
    if (!event) {
      return;
    }
    
    setLocation(`/checkout/event/${id}?startDate=${event.date}&endDate=${event.date}&guests=${ticketCount}`);
  };
  
  // Format event date and time
  const formatEventDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "EEEE, MMMM d, yyyy"),
      time: format(date, "h:mm a")
    };
  };
  
  // Calculate remaining tickets
  const calculateRemainingTickets = () => {
    if (!event) return 0;
    
    // Assuming 20% of tickets are already booked
    return Math.floor(event.capacity * 0.8);
  };
  
  const isLoading = isLoadingEvent || (event?.destinationId && isLoadingDestination);
  const remainingTickets = calculateRemainingTickets();
  const eventDateTime = event ? formatEventDateTime(event.date) : { date: "", time: "" };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    return parseInt(ticketCount) * (event?.price || 0);
  };
  
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

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Event Not Found</h1>
          <p className="mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events">
            <Button>Browse All Events</Button>
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
                src={event.imageUrl} 
                alt={event.name} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold mb-4">{event.name}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Calendar className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div className="text-neutral-600">{eventDateTime.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-neutral-600">{eventDateTime.time}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="text-primary w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-neutral-600">{event.location}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {destination && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center">
                  <Info className="text-primary w-5 h-5 mr-2" />
                  <p className="text-neutral-600">
                    This event takes place in <Link href={`/destinations/${destination.id}`}>
                      <a className="text-primary hover:underline font-medium">{destination.name}, {destination.country}</a>
                    </Link>
                  </p>
                </div>
              </div>
            )}
            
            <Separator className="my-6" />
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold mb-4">Event Description</h2>
                <p className="text-neutral-600 whitespace-pre-line">{event.description}</p>
              </div>
              
              <div>
                <h2 className="text-xl font-heading font-bold mb-4">Event Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg border border-neutral-200">
                    <h3 className="font-heading font-semibold text-lg mb-3">What to Expect</h3>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Immersive cultural experience</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Interactive activities</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Local guides and experts</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Photo opportunities</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg border border-neutral-200">
                    <h3 className="font-heading font-semibold text-lg mb-3">Additional Information</h3>
                    <ul className="space-y-2 text-neutral-600">
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Duration: Approximately 3 hours</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Suitable for all ages</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Comfortable walking shoes recommended</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span>Weather appropriate clothing advised</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Book This Event</h2>
                
                <div className="space-y-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg mb-4">
                    <div className="text-lg font-heading font-bold">{formatCurrency(event.price)}</div>
                    <div className="text-sm text-neutral-500">per person</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Date</label>
                    <div className="bg-neutral-50 p-3 rounded-lg border">
                      <div className="font-medium">{eventDateTime.date}</div>
                      <div className="text-sm text-neutral-500">{eventDateTime.time}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-sm font-medium">Number of Tickets</label>
                      <span className="text-xs text-neutral-500">{remainingTickets} tickets left</span>
                    </div>
                    <Select value={ticketCount} onValueChange={setTicketCount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tickets" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem 
                            key={num} 
                            value={num.toString()}
                            disabled={num > remainingTickets}
                          >
                            {num} {num === 1 ? "ticket" : "tickets"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{formatCurrency(event.price)} x {ticketCount} {parseInt(ticketCount) === 1 ? "ticket" : "tickets"}</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!event.available || remainingTickets === 0}
                  >
                    {!event.available || remainingTickets === 0 ? "Sold Out" : "Book Now"}
                  </Button>
                  
                  <div className="flex items-center justify-center text-sm text-neutral-500">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{event.capacity} total capacity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-2">Cancellation Policy</h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>• Free cancellation up to 48 hours before the event</p>
                  <p>• 50% refund between 48 and 24 hours before the event</p>
                  <p>• No refund within 24 hours of the event</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
