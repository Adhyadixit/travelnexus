import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import { Cab, Destination } from "@shared/schema";
import CabCard from "@/components/cards/cab-card";
import { Loader2, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Helmet } from 'react-helmet';

export default function CabBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  const { data: cabs = [], isLoading: cabsLoading } = useQuery<Cab[]>({
    queryKey: ["/api/cabs"],
  });
  
  const { data: destinations = [], isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  const isLoading = cabsLoading || destinationsLoading;
  
  // Get all available languages from cabs
  const allLanguages = new Set<string>();
  cabs.forEach(cab => {
    if (cab.languages) {
      (cab.languages as string[]).forEach(lang => allLanguages.add(lang));
    }
  });
  
  // Filter cabs based on filters
  const filteredCabs = cabs.filter(cab => {
    // Search term filter
    const matchesSearch = cab.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cab.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Destination filter
    const matchesDestination = selectedDestinations.length === 0 || 
                               selectedDestinations.includes(cab.destinationId);
    
    // Price range filter
    let matchesPrice = true;
    if (priceRange === "budget") {
      matchesPrice = cab.dailyRate < 200;
    } else if (priceRange === "moderate") {
      matchesPrice = cab.dailyRate >= 200 && cab.dailyRate <= 300;
    } else if (priceRange === "luxury") {
      matchesPrice = cab.dailyRate > 300;
    }
    
    // Languages filter
    let matchesLanguages = true;
    if (selectedLanguages.length > 0) {
      matchesLanguages = selectedLanguages.some(lang => 
        (cab.languages as string[])?.includes(lang)
      );
    }
    
    return matchesSearch && matchesDestination && matchesPrice && matchesLanguages;
  });

  return (
    <PageContainer>
      <Helmet>
        <title>Private Drivers | TravelEase</title>
        <meta name="description" content="Book professional drivers and luxury transportation for your international travel. Explore our private car services with experienced local drivers." />
        <meta property="og:title" content="Private Drivers | TravelEase" />
        <meta property="og:description" content="Book premium transportation with skilled local drivers for a seamless travel experience." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Private Drivers</h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Discover our professional drivers for hassle-free transportation during your travels. Enjoy comfort and local expertise.
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Search drivers or vehicle types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Destination Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Destinations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by destination</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {destinations.map((destination) => (
                  <DropdownMenuCheckboxItem
                    key={destination.id}
                    checked={selectedDestinations.includes(destination.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDestinations([...selectedDestinations, destination.id]);
                      } else {
                        setSelectedDestinations(selectedDestinations.filter(id => id !== destination.id));
                      }
                    }}
                  >
                    {destination.name}, {destination.country}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Price Range Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Price Range
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by daily rate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={priceRange === "budget"}
                  onCheckedChange={(checked) => {
                    setPriceRange(checked ? "budget" : null);
                  }}
                >
                  Budget (Under $200)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priceRange === "moderate"}
                  onCheckedChange={(checked) => {
                    setPriceRange(checked ? "moderate" : null);
                  }}
                >
                  Moderate ($200 - $300)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priceRange === "luxury"}
                  onCheckedChange={(checked) => {
                    setPriceRange(checked ? "luxury" : null);
                  }}
                >
                  Luxury (Over $300)
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Languages Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Languages
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.from(allLanguages).map((language) => (
                  <DropdownMenuCheckboxItem
                    key={language}
                    checked={selectedLanguages.includes(language)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLanguages([...selectedLanguages, language]);
                      } else {
                        setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
                      }
                    }}
                  >
                    {language}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredCabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCabs.map((cab) => {
              const destination = destinations.find(d => d.id === cab.destinationId);
              return (
                <CabCard
                  key={cab.id}
                  cab={cab}
                  destinationName={destination?.name || ""}
                  destinationCountry={destination?.country || ""}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-neutral-500">
              {searchTerm || selectedDestinations.length > 0 || priceRange || selectedLanguages.length > 0
                ? "No drivers found matching your filters. Please try different criteria."
                : "No drivers found. Check back soon for new listings!"}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
