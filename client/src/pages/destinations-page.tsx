import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Destination } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { DestinationCard } from "@/components/destinations/destination-card";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function DestinationsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Fetch all destinations
  const { 
    data: destinations,
    isLoading
  } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Filter and sort destinations based on search term and sort criteria
  const filteredDestinations = destinations?.filter(destination => 
    destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.country.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedDestinations = [...(filteredDestinations || [])].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "country":
        return a.country.localeCompare(b.country);
      case "featured":
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Explore Destinations"
        subtitle="Discover amazing places around the world and start planning your next adventure"
        height="md"
      >
        <div className="mt-6 max-w-lg mx-auto">
          <SearchForm variant="compact" />
        </div>
      </ImageBanner>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <PageTitle 
            title="Popular Destinations" 
            subtitle="Find your perfect destination from our curated selection"
          />
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : sortedDestinations?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No destinations found</h3>
            <p className="text-neutral-500 mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedDestinations?.map((destination) => (
              <DestinationCard 
                key={destination.id} 
                destination={destination} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
