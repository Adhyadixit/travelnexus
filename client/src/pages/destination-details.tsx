import { useState } from "react";
import { useParams, Link } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Destination, Package, Hotel, Event } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { PackageCard } from "@/components/packages/package-card";
import { HotelCard } from "@/components/hotels/hotel-card";
import { DriverCard } from "@/components/cabs/driver-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, ChevronRight } from "lucide-react";

export default function DestinationDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [activeTab, setActiveTab] = useState("packages");
  
  // Fetch destination details
  const { 
    data: destination,
    isLoading: isLoadingDestination
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${id}`],
  });
  
  // Fetch packages for this destination
  const { 
    data: packages,
    isLoading: isLoadingPackages
  } = useQuery<Package[]>({
    queryKey: [`/api/packages?destinationId=${id}`],
    enabled: !!id,
  });
  
  // Fetch hotels for this destination
  const { 
    data: hotels,
    isLoading: isLoadingHotels
  } = useQuery<Hotel[]>({
    queryKey: [`/api/hotels?destinationId=${id}`],
    enabled: !!id,
  });
  
  // Fetch drivers for this destination
  const { 
    data: drivers,
    isLoading: isLoadingDrivers
  } = useQuery<any[]>({
    queryKey: [`/api/drivers?destinationId=${id}`],
    enabled: !!id,
  });
  
  // Fetch events for this destination
  const { 
    data: events,
    isLoading: isLoadingEvents
  } = useQuery<Event[]>({
    queryKey: [`/api/events?destinationId=${id}`],
    enabled: !!id,
  });

  if (isLoadingDestination) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-full max-w-2xl" />
            <Skeleton className="h-6 w-full max-w-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!destination) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Destination Not Found</h1>
          <p className="mb-8">The destination you're looking for doesn't exist or has been removed.</p>
          <Link href="/destinations">
            <Button>Browse All Destinations</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ImageBanner
        imageUrl={destination.imageUrl}
        title={destination.name}
        subtitle={destination.country}
        height="lg"
      >
        {destination.featured && (
          <Badge className="mt-4 bg-secondary">Featured Destination</Badge>
        )}
      </ImageBanner>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-4xl">
          <h2 className="text-2xl font-heading font-bold mb-4">About {destination.name}</h2>
          <p className="text-neutral-600 whitespace-pre-line">{destination.description}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="w-full md:w-auto border-b mb-6">
            <TabsTrigger value="packages">Travel Packages</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="packages">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-bold">Popular Packages in {destination.name}</h3>
              <Link href="/packages">
                <a className="text-primary font-medium hidden md:flex items-center hover:underline">
                  View All Packages
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
            
            {isLoadingPackages ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-10 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : packages?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No packages available for this destination yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages?.map((pkg) => (
                  <PackageCard key={pkg.id} package={pkg} />
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center md:hidden">
              <Link href="/packages">
                <a className="text-primary font-medium">View All Packages</a>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="hotels">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-bold">Hotels in {destination.name}</h3>
              <Link href="/hotels">
                <a className="text-primary font-medium hidden md:flex items-center hover:underline">
                  View All Hotels
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
            
            {isLoadingHotels ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-10 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hotels?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No hotels available for this destination yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels?.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center md:hidden">
              <Link href="/hotels">
                <a className="text-primary font-medium">View All Hotels</a>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="drivers">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-bold">Drivers in {destination.name}</h3>
              <Link href="/cabs">
                <a className="text-primary font-medium hidden md:flex items-center hover:underline">
                  View All Drivers
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
            
            {isLoadingDrivers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : drivers?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No drivers available for this destination yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {drivers?.map((driver) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center md:hidden">
              <Link href="/cabs">
                <a className="text-primary font-medium">View All Drivers</a>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-bold">Events in {destination.name}</h3>
              <Link href="/events">
                <a className="text-primary font-medium hidden md:flex items-center hover:underline">
                  View All Events
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
            
            {isLoadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-10 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No events available for this destination yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events?.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <Link href={`/events/${event.id}`}>
                      <a className="block">
                        <img 
                          src={event.imageUrl} 
                          alt={event.name} 
                          className="w-full h-48 object-cover"
                        />
                      </a>
                    </Link>
                    <div className="p-5">
                      <Link href={`/events/${event.id}`}>
                        <a className="block">
                          <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                            {event.name}
                          </h3>
                        </a>
                      </Link>
                      
                      <div className="flex items-center mt-2 mb-3">
                        <CalendarIcon className="text-primary w-4 h-4 mr-1" />
                        <span className="text-neutral-700 text-sm">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <MapPinIcon className="text-neutral-500 w-4 h-4 mr-1" />
                        <span className="text-neutral-500 text-sm">{event.location}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-neutral-500 text-xs">Price</span>
                          <p className="text-lg font-heading font-bold">
                            ${event.price.toFixed(2)}
                          </p>
                        </div>
                        <Link href={`/events/${event.id}`}>
                          <Button size="sm">Book Now</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center md:hidden">
              <Link href="/events">
                <a className="text-primary font-medium">View All Events</a>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
