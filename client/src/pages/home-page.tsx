import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { Button } from "@/components/ui/button";
import { Destination, Package, Hotel, Cruise } from "@shared/schema";
import { DestinationCard } from "@/components/destinations/destination-card";
import { PackageCard } from "@/components/packages/package-card";
import { HotelCard } from "@/components/hotels/hotel-card";
import { CruiseCard } from "@/components/cruises/cruise-card";
import { DriverCard } from "@/components/cabs/driver-card";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  // Fetch featured destinations
  const { 
    data: destinations,
    isLoading: isLoadingDestinations
  } = useQuery<Destination[]>({
    queryKey: ["/api/destinations?featured=true"],
  });
  
  // Fetch featured packages
  const { 
    data: packages,
    isLoading: isLoadingPackages
  } = useQuery<Package[]>({
    queryKey: ["/api/packages?featured=true"],
  });
  
  // Fetch featured hotels
  const { 
    data: hotels,
    isLoading: isLoadingHotels
  } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels?featured=true"],
  });
  
  // Fetch featured cruises
  const { 
    data: cruises,
    isLoading: isLoadingCruises
  } = useQuery<Cruise[]>({
    queryKey: ["/api/cruises?featured=true"],
  });
  
  // Fetch drivers
  const { 
    data: drivers,
    isLoading: isLoadingDrivers
  } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  return (
    <Layout>
      {/* Hero Banner */}
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Explore the World with Us"
        subtitle="Discover amazing destinations, book your perfect stay, and create unforgettable memories."
        height="lg"
      >
        <div className="mt-4 md:mt-8">
          <SearchForm />
        </div>
      </ImageBanner>

      {/* Popular Destinations */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">Popular Destinations</h2>
            <Link href="/destinations" className="text-primary font-medium hidden md:flex items-center hover:underline">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {isLoadingDestinations ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex space-x-4 pb-4 min-w-max md:grid md:grid-cols-5 md:gap-4 md:space-x-0">
                {destinations?.slice(0, 5).map((destination) => (
                  <div key={destination.id} className="w-40 md:w-auto flex-shrink-0">
                    <DestinationCard 
                      destination={destination} 
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center md:hidden">
                <Link href="/destinations" className="text-primary font-medium">
                  View All Destinations
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-10 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">Featured Packages</h2>
            <Link href="/packages" className="text-primary font-medium hidden md:flex items-center hover:underline">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {isLoadingPackages ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages?.slice(0, 3).map((pkg) => (
                <PackageCard key={pkg.id} package={pkg} />
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center md:hidden">
            <Link href="/packages" className="text-primary font-medium">
              View All Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Luxury Hotels */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">Luxury Hotels</h2>
            <Link href="/hotels" className="text-primary font-medium hidden md:flex items-center hover:underline">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {isLoadingHotels ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels?.slice(0, 3).map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center md:hidden">
            <Link href="/hotels" className="text-primary font-medium">
              View All Hotels
            </Link>
          </div>
        </div>
      </section>

      {/* Cruise Adventures */}
      <section className="py-10 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">Cruise Adventures</h2>
            <Link href="/cruises" className="text-primary font-medium hidden md:flex items-center hover:underline">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {isLoadingCruises ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-60 w-full rounded-xl" />
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cruises?.slice(0, 2).map((cruise) => (
                <CruiseCard key={cruise.id} cruise={cruise} />
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center md:hidden">
            <Link href="/cruises" className="text-primary font-medium">
              View All Cruises
            </Link>
          </div>
        </div>
      </section>

      {/* Private Drivers */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">Private Drivers</h2>
            <Link href="/cabs" className="text-primary font-medium hidden md:flex items-center hover:underline">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
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
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {drivers?.slice(0, 4).map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center md:hidden">
            <Link href="/cabs" className="text-primary font-medium">
              View All Drivers
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-10 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-neutral-100 mb-6 max-w-xl mx-auto">
            Get exclusive travel deals, insider tips, and updates on our latest offers delivered straight to your inbox.
          </p>
          <div className="max-w-md mx-auto flex flex-col md:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-4 py-3 rounded-lg w-full text-neutral-800 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <Button 
              variant="secondary" 
              className="whitespace-nowrap"
              size="lg"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
