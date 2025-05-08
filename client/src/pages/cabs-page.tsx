import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Driver } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { ImageBanner } from "@/components/ui/image-banner";
import { SearchForm } from "@/components/ui/search-form";
import { DriverCard } from "@/components/cabs/driver-card";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CabsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [searchTerm, setSearchTerm] = useState("");
  const [rateRange, setRateRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState("rating");
  
  // Fetch all drivers
  const { 
    data: drivers,
    isLoading
  } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });
  
  // Filter and sort drivers based on criteria
  const filteredDrivers = drivers?.filter(driver => 
    (searchTerm === "" || 
     driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     driver.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
     driver.languages.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (driver.dailyRate >= rateRange[0] && driver.dailyRate <= rateRange[1]) &&
    driver.available
  );
  
  const sortedDrivers = [...(filteredDrivers || [])].sort((a, b) => {
    switch (sortBy) {
      case "rate-low":
        return a.dailyRate - b.dailyRate;
      case "rate-high":
        return b.dailyRate - a.dailyRate;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <ImageBanner
        imageUrl="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600"
        title="Private Drivers"
        subtitle="Hire experienced local drivers for a comfortable and personalized travel experience"
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
                      placeholder="Driver name, car, language..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium">Daily Rate</label>
                    <span className="text-sm text-neutral-500">
                      {formatCurrency(rateRange[0])} - {formatCurrency(rateRange[1])}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 500]}
                    min={0}
                    max={500}
                    step={10}
                    value={rateRange}
                    onValueChange={(value) => setRateRange(value as [number, number])}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Languages</label>
                  <div className="space-y-2">
                    {["English", "Arabic", "Chinese", "French", "Spanish", "Japanese", "Italian"].map((language) => (
                      <div 
                        key={language}
                        className="flex items-center p-2 rounded-md cursor-pointer hover:bg-neutral-100"
                      >
                        <input 
                          type="checkbox" 
                          id={`lang-${language}`} 
                          className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`lang-${language}`} className="ml-2 text-sm">{language}</label>
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
                title="Private Drivers" 
                subtitle={`${sortedDrivers?.length || 0} drivers available`}
              />
              
              <div className="w-full md:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="rate-low">Rate: Low to High</SelectItem>
                    <SelectItem value="rate-high">Rate: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
            ) : sortedDrivers?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">No drivers match your criteria</h3>
                <p className="text-neutral-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedDrivers?.map((driver) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
