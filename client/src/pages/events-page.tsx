import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

export default function EventsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("date");
  
  // Fetch all events
  const { 
    data: events,
    isLoading
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Filter and sort events based on criteria
  const filteredEvents = events?.filter(event => 
    (searchTerm === "" || 
     event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     event.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (event.price >= priceRange[0] && event.price <= priceRange[1]) &&
    new Date(event.date) >= new Date() // Only show future events
  );
  
  const sortedEvents = [...(filteredEvents || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "date":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Local Events & Experiences"
        subtitle="Discover unique events and activities at your travel destination"
        height="md"
      >
        <div className="mt-6 max-w-lg mx-auto">
          <SearchForm variant="compact" />
        </div>
      </ImageBanner>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters - Side panel */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-heading font-bold text-lg mb-4">Filters</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Event name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium">Price Range</label>
                    <span className="text-sm text-neutral-500">
                      {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 1000]}
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <div className="space-y-2">
                    {["Cultural", "Food & Drink", "Music", "Nightlife", "Tours", "Outdoor", "Sports"].map((type) => (
                      <div 
                        key={type}
                        className="flex items-center p-2 rounded-md cursor-pointer hover:bg-neutral-100"
                      >
                        <input 
                          type="checkbox" 
                          id={`type-${type}`} 
                          className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`type-${type}`} className="ml-2 text-sm">{type}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <PageTitle 
                title="Upcoming Events" 
                subtitle={`${sortedEvents?.length || 0} events available`}
              />
              
              <div className="w-full md:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date: Soonest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
            ) : sortedEvents?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">No events match your criteria</h3>
                <p className="text-neutral-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents?.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/events/${event.id}`}>
                      <a className="block">
                        <img 
                          src={event.imageUrl} 
                          alt={event.name} 
                          className="w-full h-48 object-cover"
                        />
                      </a>
                    </Link>
                    <CardContent className="p-5">
                      <Link href={`/events/${event.id}`}>
                        <a className="block">
                          <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors mb-2">
                            {event.name}
                          </h3>
                        </a>
                      </Link>
                      
                      <div className="flex items-center mt-2 mb-3">
                        <Calendar className="text-primary w-4 h-4 mr-1" />
                        <span className="text-neutral-700 text-sm">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <MapPin className="text-neutral-500 w-4 h-4 mr-1" />
                        <span className="text-neutral-500 text-sm">{event.location}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-neutral-500 text-xs">Price</span>
                          <p className="text-lg font-heading font-bold">
                            {formatCurrency(event.price)}
                          </p>
                        </div>
                        <Link href={`/events/${event.id}`}>
                          <Button size="sm">Book Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
