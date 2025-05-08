import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Hotel } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { HotelCard } from "@/components/hotels/hotel-card";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function HotelsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("rating");
  const [hotelTypeFilter, setHotelTypeFilter] = useState<string | null>(null);
  
  // Fetch all hotels
  const { 
    data: hotels,
    isLoading
  } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });
  
  // Filter and sort hotels based on criteria
  const filteredHotels = hotels?.filter(hotel => 
    (searchTerm === "" || hotel.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (ratingFilter === null || hotel.rating === ratingFilter) &&
    (hotelTypeFilter === null || hotel.hotelType === hotelTypeFilter) &&
    (hotel.price >= priceRange[0] && hotel.price <= priceRange[1])
  );
  
  const sortedHotels = [...(filteredHotels || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Luxury Hotels"
        subtitle="Find the perfect accommodation for your dream vacation"
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
                      placeholder="Hotel name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Star Rating</label>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div 
                        key={rating}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${ratingFilter === rating ? 'bg-primary/10' : 'hover:bg-neutral-100'}`}
                        onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                      >
                        <div className="flex">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 text-yellow-400 ${ratingFilter === rating ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{rating} Stars</span>
                      </div>
                    ))}
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
                    onValueChange={setPriceRange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Accommodation Type</label>
                  <div className="space-y-2">
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer ${hotelTypeFilter === 'hotel' ? 'bg-primary/10' : 'hover:bg-neutral-100'}`}
                      onClick={() => setHotelTypeFilter(hotelTypeFilter === 'hotel' ? null : 'hotel')}
                    >
                      <span className="text-sm">Hotel</span>
                    </div>
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer ${hotelTypeFilter === 'resort' ? 'bg-primary/10' : 'hover:bg-neutral-100'}`}
                      onClick={() => setHotelTypeFilter(hotelTypeFilter === 'resort' ? null : 'resort')}
                    >
                      <span className="text-sm">Resort</span>
                    </div>
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer ${hotelTypeFilter === 'villa' ? 'bg-primary/10' : 'hover:bg-neutral-100'}`}
                      onClick={() => setHotelTypeFilter(hotelTypeFilter === 'villa' ? null : 'villa')}
                    >
                      <span className="text-sm">Villa</span>
                    </div>
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer ${hotelTypeFilter === 'independent_house' ? 'bg-primary/10' : 'hover:bg-neutral-100'}`}
                      onClick={() => setHotelTypeFilter(hotelTypeFilter === 'independent_house' ? null : 'independent_house')}
                    >
                      <span className="text-sm">Independent House</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <PageTitle 
                title="Find Your Perfect Stay" 
                subtitle={`${sortedHotels?.length || 0} hotels found`}
              />
              
              <div className="w-full md:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Top Rated</SelectItem>
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
            ) : sortedHotels?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">No hotels match your criteria</h3>
                <p className="text-neutral-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedHotels?.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
