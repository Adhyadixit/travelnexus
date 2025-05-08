import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Loader2, 
  ArrowLeft, 
  Hotel, 
  Luggage, 
  Car, 
  Ticket, 
  Star 
} from 'lucide-react';

import { Destination, Package, Hotel, Driver, Event } from '@shared/schema';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export default function DestinationDetailPage() {
  const [match, params] = useRoute('/destinations/:id');
  const destinationId = match ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState('packages');
  
  // Fetch destination details
  const { 
    data: destination, 
    isLoading: isLoadingDestination, 
    error: destinationError 
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${destinationId}`],
    enabled: !!destinationId,
  });
  
  // Fetch packages for this destination
  const { 
    data: packages, 
    isLoading: isLoadingPackages 
  } = useQuery<Package[]>({
    queryKey: [`/api/destinations/${destinationId}/packages`],
    enabled: !!destinationId && activeTab === 'packages',
  });
  
  // Fetch hotels for this destination
  const { 
    data: hotels, 
    isLoading: isLoadingHotels 
  } = useQuery<Hotel[]>({
    queryKey: [`/api/destinations/${destinationId}/hotels`],
    enabled: !!destinationId && activeTab === 'hotels',
  });
  
  // Fetch drivers for this destination
  const { 
    data: drivers, 
    isLoading: isLoadingDrivers 
  } = useQuery<Driver[]>({
    queryKey: [`/api/destinations/${destinationId}/drivers`],
    enabled: !!destinationId && activeTab === 'drivers',
  });
  
  // Fetch events for this destination
  const { 
    data: events, 
    isLoading: isLoadingEvents 
  } = useQuery<Event[]>({
    queryKey: [`/api/destinations/${destinationId}/events`],
    enabled: !!destinationId && activeTab === 'events',
  });
  
  // Handle loading and error states
  if (isLoadingDestination) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading destination...</h2>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }
  
  if (destinationError || !destination) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Destination not found</h2>
            <p className="text-neutral-600 mb-4">The destination you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/destinations">Explore Other Destinations</Link>
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{destination.name} - Travel Destination | TravelEase</title>
        <meta name="description" content={`Explore ${destination.name}, ${destination.country}. Find packages, hotels, activities and more for your dream vacation to ${destination.name}.`} />
        <meta property="og:title" content={`${destination.name} - Travel Destination | TravelEase`} />
        <meta property="og:description" content={`Explore ${destination.name}, ${destination.country}. Book your perfect ${destination.name} vacation with TravelEase.`} />
        <meta property="og:image" content={destination.imageUrl} />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative h-[50vh] min-h-[400px]">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${destination.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
              <div className="container mx-auto">
                <Button asChild variant="outline" className="mb-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                  <Link href="/destinations">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Destinations
                  </Link>
                </Button>
                <div className="flex flex-col md:flex-row md:items-end justify-between">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{destination.name}</h1>
                    <div className="flex items-center text-white">
                      <MapPin className="h-5 w-5 mr-1" />
                      <span>{destination.country}</span>
                    </div>
                  </div>
                  {destination.featured && (
                    <Badge className="mt-4 md:mt-0 bg-secondary text-white self-start md:self-auto">
                      Featured Destination
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </section>
          
          {/* Description Section */}
          <section className="py-8 md:py-12 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">About {destination.name}</h2>
                <p className="text-neutral-700 whitespace-pre-line">
                  {destination.description}
                </p>
                
                <div className="mt-8 flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-primary mr-2" />
                    <span className="text-neutral-700">Country: <strong>{destination.country}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                    <span className="text-neutral-700">Best time to visit: <strong>Year-round</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Tabs Section */}
          <section className="py-8 md:py-12 bg-neutral-50">
            <div className="container mx-auto px-4">
              <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b mb-8">
                  <div className="max-w-4xl mx-auto">
                    <TabsList className="w-full grid grid-cols-4 mb-0">
                      <TabsTrigger value="packages" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        <Luggage className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">Travel Packages</span>
                        <span className="md:hidden">Packages</span>
                      </TabsTrigger>
                      <TabsTrigger value="hotels" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        <Hotel className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">Hotels</span>
                        <span className="md:hidden">Hotels</span>
                      </TabsTrigger>
                      <TabsTrigger value="drivers" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        <Car className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">Drivers</span>
                        <span className="md:hidden">Drivers</span>
                      </TabsTrigger>
                      <TabsTrigger value="events" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        <Ticket className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">Events</span>
                        <span className="md:hidden">Events</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <div className="max-w-6xl mx-auto">
                  {/* Packages Tab */}
                  <TabsContent value="packages">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Travel Packages in {destination.name}</h2>
                      </div>
                      
                      {isLoadingPackages ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : packages?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                          <Luggage className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No packages available</h3>
                          <p className="text-neutral-600 mb-4">
                            We don't have any travel packages for {destination.name} at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {packages?.map(pkg => (
                            <PackageCard key={pkg.id} package={pkg} />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Hotels Tab */}
                  <TabsContent value="hotels">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Hotels in {destination.name}</h2>
                      </div>
                      
                      {isLoadingHotels ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : hotels?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                          <Hotel className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No hotels available</h3>
                          <p className="text-neutral-600 mb-4">
                            We don't have any hotels in {destination.name} at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {hotels?.map(hotel => (
                            <HotelCard key={hotel.id} hotel={hotel} />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Drivers Tab */}
                  <TabsContent value="drivers">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Drivers in {destination.name}</h2>
                      </div>
                      
                      {isLoadingDrivers ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : drivers?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                          <Car className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No drivers available</h3>
                          <p className="text-neutral-600 mb-4">
                            We don't have any drivers in {destination.name} at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {drivers?.map(driver => (
                            <DriverCard key={driver.id} driver={driver} />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Events Tab */}
                  <TabsContent value="events">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Events in {destination.name}</h2>
                      </div>
                      
                      {isLoadingEvents ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : events?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                          <Ticket className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No events available</h3>
                          <p className="text-neutral-600 mb-4">
                            We don't have any events in {destination.name} at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {events?.map(event => (
                            <EventCard key={event.id} event={event} />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </section>
        </main>
        
        <Footer />
        <MobileNav />
      </div>
    </>
  );
}

function PackageCard({ package: pkg }: { package: Package }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <img 
          src={pkg.imageUrl} 
          alt={pkg.name} 
          className="w-full h-full object-cover"
        />
        {pkg.featured && (
          <Badge className="absolute top-2 right-2 bg-secondary text-white">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
        <div className="flex items-center text-sm text-neutral-500 mb-3">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{pkg.duration} days</span>
        </div>
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
        
        {pkg.rating && (
          <div className="flex items-center mb-3">
            <Star className="text-secondary h-4 w-4 fill-secondary" />
            <span className="text-neutral-700 font-medium text-sm ml-1">
              {pkg.rating.toFixed(1)}
            </span>
            <span className="text-neutral-500 text-xs ml-1">
              ({pkg.reviewCount || 0} reviews)
            </span>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Starting from</span>
            <p className="text-lg font-bold">${pkg.price}</p>
          </div>
          <Button asChild>
            <Link href={`/checkout?id=${pkg.id}&type=package&name=${encodeURIComponent(pkg.name)}&price=${pkg.price}&image=${encodeURIComponent(pkg.imageUrl)}&duration=${pkg.duration}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const renderStars = () => {
    return Array(hotel.stars)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="text-secondary text-xs h-3 w-3 fill-secondary" />
      ));
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <img 
          src={hotel.imageUrl} 
          alt={hotel.name} 
          className="w-full h-full object-cover"
        />
        {hotel.featured && (
          <Badge className="absolute top-2 right-2 bg-secondary text-white">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg">{hotel.name}</h3>
          <div className="flex ml-2">
            {renderStars()}
          </div>
        </div>
        <div className="flex items-center text-sm text-neutral-500 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{hotel.location}</span>
        </div>
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{hotel.description}</p>
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Per night from</span>
            <p className="text-lg font-bold">${hotel.pricePerNight}</p>
          </div>
          <Button asChild>
            <Link href={`/checkout?id=${hotel.id}&type=hotel&name=${encodeURIComponent(hotel.name)}&price=${hotel.pricePerNight}&image=${encodeURIComponent(hotel.imageUrl)}`}>
              Book Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DriverCard({ driver }: { driver: Driver }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40">
        <img 
          src={driver.imageUrl} 
          alt={`${driver.name}'s vehicle`} 
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-5">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-neutral-200">
            <img
              src={driver.profileImage}
              alt={driver.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-lg">{driver.name}</h3>
            <div className="flex items-center">
              <Star className="text-secondary text-xs h-3 w-3 fill-secondary" />
              <span className="text-neutral-700 font-medium text-sm ml-1">
                {driver.rating?.toFixed(1) || '4.8'}
              </span>
              <span className="text-neutral-500 text-xs ml-1">
                ({driver.reviewCount || '0'})
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 mb-4">
          <div className="flex items-center text-sm">
            <Car className="text-neutral-500 h-4 w-4 mr-1" />
            <span className="text-neutral-600">{driver.carType}</span>
          </div>
          <div className="flex items-center text-sm">
            <Globe className="text-neutral-500 h-4 w-4 mr-1" />
            <span className="text-neutral-600">{driver.languages}</span>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Daily rate</span>
            <p className="text-lg font-bold">${driver.dailyRate}</p>
          </div>
          <Button 
            asChild
            disabled={!driver.available}
          >
            {driver.available ? (
              <Link href={`/checkout?id=${driver.id}&type=driver&name=${encodeURIComponent(driver.name)}&price=${driver.dailyRate}&image=${encodeURIComponent(driver.imageUrl)}`}>
                Book Driver
              </Link>
            ) : (
              <span>Unavailable</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: Event }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="md:flex">
        <div className="md:w-2/5 h-48 md:h-auto">
          <img 
            src={event.imageUrl} 
            alt={event.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-5 md:w-3/5">
          <h3 className="font-bold text-lg mb-1">{event.name}</h3>
          
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex items-center text-sm text-neutral-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{event.venue}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
          </div>
          
          <p className="text-neutral-600 text-sm mb-4">{event.description}</p>
          
          <div className="flex justify-between items-center mt-auto pt-3 border-t">
            <div>
              <span className="text-neutral-500 text-xs">Price per person</span>
              <p className="text-lg font-bold">${event.price}</p>
            </div>
            <Button asChild>
              <Link href={`/checkout?id=${event.id}&type=event&name=${encodeURIComponent(event.name)}&price=${event.price}&image=${encodeURIComponent(event.imageUrl)}`}>
                Book Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
