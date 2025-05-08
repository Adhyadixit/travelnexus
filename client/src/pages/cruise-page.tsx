import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Cruise } from '@shared/schema';
import { Search, Star, Clock, Loader2, Anchor, Ship, Filter } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CruisePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [durationRange, setDurationRange] = useState([0, 30]);
  const [sortBy, setSortBy] = useState<string>('price-low');
  
  // Fetch all cruises
  const { data: cruises, isLoading, error } = useQuery<Cruise[]>({
    queryKey: ['/api/cruises'],
  });

  // Filter cruises
  const filteredCruises = cruises?.filter(cruise => {
    const matchesSearch = 
      cruise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cruise.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cruise.departureLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cruise.destinations.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cruise.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = 
      cruise.price >= priceRange[0] && 
      cruise.price <= priceRange[1];
    
    const matchesDuration = 
      cruise.duration >= durationRange[0] && 
      cruise.duration <= durationRange[1];
    
    return matchesSearch && matchesPrice && matchesDuration;
  });

  // Sort cruises
  const sortedCruises = [...(filteredCruises || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'duration-short':
        return a.duration - b.duration;
      case 'duration-long':
        return b.duration - a.duration;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort selection
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 5000]);
    setDurationRange([0, 30]);
    setSortBy('price-low');
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to load cruises</h2>
            <p className="text-neutral-600 mb-4">Please try again later</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Get max price and duration for the sliders
  const maxPrice = cruises ? Math.max(...cruises.map(cruise => cruise.price)) : 5000;
  const maxDuration = cruises ? Math.max(...cruises.map(cruise => cruise.duration)) : 30;

  return (
    <>
      <Helmet>
        <title>Cruise Adventures - TravelEase</title>
        <meta name="description" content="Explore luxurious cruise experiences to the world's most stunning destinations. Book your perfect cruise holiday with TravelEase today." />
        <meta property="og:title" content="Cruise Adventures - TravelEase" />
        <meta property="og:description" content="Explore luxurious cruise experiences to the world's most stunning destinations. Book your perfect cruise holiday today." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero section */}
          <section className="bg-primary text-white py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Amazing Cruise Adventures</h1>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Explore the world's most beautiful oceans and coastlines in luxury and style
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search cruises by name, line, or destination..." 
                    className="pl-10 py-6 bg-white text-neutral-800 w-full"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </div>
          </section>
          
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Filters (desktop) */}
                <div className="hidden md:block">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-bold mb-4">Filters</h2>
                    
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Price Range</h3>
                      <div className="px-2">
                        <Slider 
                          defaultValue={[0, maxPrice]} 
                          max={maxPrice}
                          step={50}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-neutral-500">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="mb-6" />
                    
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Duration (days)</h3>
                      <div className="px-2">
                        <Slider 
                          defaultValue={[0, maxDuration]} 
                          max={maxDuration}
                          step={1}
                          value={durationRange}
                          onValueChange={setDurationRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-neutral-500">
                          <span>{durationRange[0]} days</span>
                          <span>{durationRange[1]} days</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="mb-6" />
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
                
                {/* Cruises list */}
                <div className="md:col-span-3">
                  {/* Mobile filters button */}
                  <div className="md:hidden mb-4 flex justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 mr-2">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Filters</DialogTitle>
                          <DialogDescription>
                            Refine your cruise search
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Price Range</h3>
                          <div className="px-2">
                            <Slider 
                              defaultValue={[0, maxPrice]} 
                              max={maxPrice}
                              step={50}
                              value={priceRange}
                              onValueChange={setPriceRange}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-neutral-500">
                              <span>${priceRange[0]}</span>
                              <span>${priceRange[1]}</span>
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <h3 className="font-medium mb-2">Duration (days)</h3>
                          <div className="px-2">
                            <Slider 
                              defaultValue={[0, maxDuration]} 
                              max={maxDuration}
                              step={1}
                              value={durationRange}
                              onValueChange={setDurationRange}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-neutral-500">
                              <span>{durationRange[0]} days</span>
                              <span>{durationRange[1]} days</span>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={resetFilters}
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="duration-short">Duration: Shortest</SelectItem>
                        <SelectItem value="duration-long">Duration: Longest</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort by (desktop) */}
                  <div className="hidden md:flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                      {sortedCruises?.length} Cruises Found
                    </h2>
                    <div className="flex items-center">
                      <span className="mr-2 text-neutral-500">Sort by:</span>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="duration-short">Duration: Shortest</SelectItem>
                          <SelectItem value="duration-long">Duration: Longest</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedCruises?.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h3 className="text-xl font-semibold mb-2">No cruises found</h3>
                      <p className="text-neutral-600 mb-4">
                        Try adjusting your filters or search for different keywords
                      </p>
                      <Button onClick={resetFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {sortedCruises?.map(cruise => (
                        <CruiseCard key={cruise.id} cruise={cruise} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
        <MobileNav />
      </div>
    </>
  );
}

function CruiseCard({ cruise }: { cruise: Cruise }) {
  // Determine badge based on rating or other criteria
  const getBadge = () => {
    if (cruise.rating && cruise.rating >= 4.8) return { type: 'accent', text: 'Luxury' };
    if (cruise.reviewCount && cruise.reviewCount > 150) return { type: 'secondary', text: 'Popular' };
    if (cruise.featured) return { type: 'secondary', text: 'Featured' };
    return { type: 'primary', text: 'Recommended' };
  };
  
  const badge = getBadge();
  const inclusions = cruise.inclusions.split(',').map(item => item.trim());

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="md:flex">
        <div className="md:w-2/5 h-60 md:h-auto relative">
          <img 
            src={cruise.imageUrl} 
            alt={cruise.name} 
            className="w-full h-full object-cover"
          />
          <Badge 
            variant={badge.type as any} 
            className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
          >
            {badge.text}
          </Badge>
        </div>
        <div className="p-6 md:w-3/5">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-1">{cruise.name}</h3>
              <div className="flex items-center mb-2">
                <Ship className="h-4 w-4 text-neutral-500 mr-1" />
                <span className="text-neutral-500 text-sm">{cruise.cruiseLine}</span>
              </div>
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-neutral-500 mr-1" />
                <span className="text-neutral-500 text-sm">{cruise.duration} day cruise</span>
              </div>
              <div className="flex items-center mb-2">
                <Anchor className="h-4 w-4 text-neutral-500 mr-1" />
                <span className="text-neutral-500 text-sm">From: {cruise.departureLocation}</span>
              </div>
            </div>
            
            <div className="mt-2 md:mt-0">
              {cruise.rating && (
                <div className="flex items-center mb-1 justify-end">
                  <Star className="text-secondary h-4 w-4 fill-secondary" />
                  <span className="text-neutral-700 font-medium text-sm ml-1">
                    {cruise.rating.toFixed(1)}
                  </span>
                  <span className="text-neutral-500 text-xs ml-1">
                    ({cruise.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
              <div className="text-right">
                <span className="text-sm text-neutral-500">Price from</span>
                <p className="text-2xl font-bold text-primary">${cruise.price}</p>
                <span className="text-xs text-neutral-500">per person</span>
              </div>
            </div>
          </div>
          
          <p className="text-neutral-600 my-4 text-sm">{cruise.description}</p>
          
          <div className="mt-4 mb-4">
            <h4 className="text-sm font-medium mb-2">Destinations:</h4>
            <p className="text-neutral-600 text-sm">{cruise.destinations}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Inclusions:</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {inclusions.slice(0, 6).map((inclusion, index) => (
                <div key={index} className="flex items-center text-sm text-neutral-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>
                  {inclusion}
                </div>
              ))}
              {inclusions.length > 6 && (
                <div className="flex items-center text-sm text-primary">
                  +{inclusions.length - 6} more
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap mt-4 pt-4 border-t justify-end">
            <Button variant="outline" className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2">
              View Details
            </Button>
            <Button asChild>
              <Link href={`/checkout?id=${cruise.id}&type=cruise&name=${encodeURIComponent(cruise.name)}&price=${cruise.price}&image=${encodeURIComponent(cruise.imageUrl)}&duration=${cruise.duration}`}>
                Book Cruise
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
