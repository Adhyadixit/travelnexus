import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Package } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { PackageCard } from "@/components/packages/package-card";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PackagesPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [searchTerm, setSearchTerm] = useState("");
  const [durationFilter, setDurationFilter] = useState<[number, number]>([1, 30]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState("trending");
  
  // Fetch all packages
  const { 
    data: packages,
    isLoading
  } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });
  
  // Filter and sort packages based on criteria
  const filteredPackages = packages?.filter(pkg => 
    (searchTerm === "" || pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (pkg.duration >= durationFilter[0] && pkg.duration <= durationFilter[1]) &&
    (pkg.price >= priceRange[0] && pkg.price <= priceRange[1])
  );
  
  const sortedPackages = [...(filteredPackages || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "duration":
        return a.duration - b.duration;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "trending":
        // Sort by trending first, then by featured, then by rating
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Travel Packages"
        subtitle="Discover incredible vacation packages to explore the world"
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
                      placeholder="Package name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium">Duration (days)</label>
                    <span className="text-sm text-neutral-500">
                      {durationFilter[0]} - {durationFilter[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[1, 30]}
                    min={1}
                    max={30}
                    step={1}
                    value={durationFilter}
                    onValueChange={(value) => setDurationFilter(value as [number, number])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium">Price Range</label>
                    <span className="text-sm text-neutral-500">
                      {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 5000]}
                    min={0}
                    max={5000}
                    step={50}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <PageTitle 
                title="Explore Travel Packages" 
                subtitle={`${sortedPackages?.length || 0} packages found`}
              />
              
              <div className="w-full md:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
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
            ) : sortedPackages?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">No packages match your criteria</h3>
                <p className="text-neutral-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedPackages?.map((pkg) => (
                  <PackageCard key={pkg.id} package={pkg} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
