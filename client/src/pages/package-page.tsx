import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Package } from '@shared/schema';
import { Search, Star, Clock, Loader2, MapPin, Filter } from 'lucide-react';

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

export default function PackagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [durationRange, setDurationRange] = useState([0, 30]);
  const [sortBy, setSortBy] = useState<string>('price-low');
  
  // Fetch all packages
  const { data: packages, isLoading, error } = useQuery<Package[]>({
    queryKey: ['/api/packages'],
  });

  // Filter packages
  const filteredPackages = packages?.filter(pkg => {
    const matchesSearch = 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = 
      pkg.price >= priceRange[0] && 
      pkg.price <= priceRange[1];
    
    const matchesDuration = 
      pkg.duration >= durationRange[0] && 
      pkg.duration <= durationRange[1];
    
    return matchesSearch && matchesPrice && matchesDuration;
  });

  // Sort packages
  const sortedPackages = [...(filteredPackages || [])].sort((a, b) => {
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
            <h2 className="text-xl font-semibold mb-2">Failed to load packages</h2>
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
  const maxPrice = packages ? Math.max(...packages.map(pkg => pkg.price)) : 5000;
  const maxDuration = packages ? Math.max(...packages.map(pkg => pkg.duration)) : 30;

  return (
    <>
      <Helmet>
        <title>Travel Packages - TravelEase</title>
        <meta name="description" content="Explore our curated travel packages to exotic destinations worldwide. Find all-inclusive deals with accommodations, tours, and more." />
        <meta property="og:title" content="Travel Packages - TravelEase" />
        <meta property="og:description" content="Explore our curated travel packages to exotic destinations worldwide. Find all-inclusive deals with accommodations, tours, and more." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero section */}
          <section className="bg-primary text-white py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Amazing Travel Packages</h1>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Explore our curated travel packages with unforgettable experiences
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search packages..." 
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
                
                {/* Packages list */}
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
                            Refine your package search
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
                      {sortedPackages?.length} Packages Found
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
                  ) : sortedPackages?.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h3 className="text-xl font-semibold mb-2">No packages found</h3>
                      <p className="text-neutral-600 mb-4">
                        Try adjusting your filters or search for different keywords
                      </p>
                      <Button onClick={resetFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {sortedPackages?.map(pkg => (
                        <PackageCard key={pkg.id} package={pkg} />
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

function PackageCard({ package: pkg }: { package: Package }) {
  // Determine badge based on rating or other criteria
  const getBadge = () => {
    if (pkg.rating && pkg.rating >= 4.8) return { type: 'accent', text: 'Premium' };
    if (pkg.reviewCount && pkg.reviewCount > 200) return { type: 'secondary', text: 'Best Seller' };
    if (pkg.featured) return { type: 'secondary', text: 'Featured' };
    return { type: 'primary-light', text: 'Popular' };
  };
  
  const badge = getBadge();
  const inclusions = pkg.inclusions.split(',').map(item => item.trim());

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="relative">
        <img 
          src={pkg.imageUrl} 
          alt={pkg.name} 
          className="w-full h-48 object-cover"
        />
        <Badge 
          variant={badge.type as any} 
          className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full"
        >
          {badge.text}
        </Badge>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-lg">{pkg.name}</h3>
          <div className="flex items-center text-sm mb-1">
            <MapPin className="h-4 w-4 text-neutral-500 mr-1" />
            <span className="text-neutral-500">Destination ID: {pkg.destinationId}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 text-neutral-500 mr-1" />
            <span className="text-neutral-500">{pkg.duration} days</span>
          </div>
        </div>
        
        <p className="text-neutral-600 text-sm mt-2 mb-4 flex-grow">
          {pkg.description}
        </p>
        
        <div className="mt-2 mb-4">
          <h4 className="text-sm font-medium mb-2">Inclusions:</h4>
          <ul className="text-xs text-neutral-600 grid grid-cols-2 gap-1">
            {inclusions.slice(0, 4).map((inclusion, index) => (
              <li key={index} className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>
                {inclusion}
              </li>
            ))}
            {inclusions.length > 4 && (
              <li className="text-primary text-xs">+{inclusions.length - 4} more</li>
            )}
          </ul>
        </div>
        
        <div className="flex justify-between items-end mt-auto pt-4 border-t">
          <div>
            <div className="flex items-center mb-1">
              {pkg.rating && (
                <>
                  <Star className="text-secondary h-4 w-4 fill-secondary" />
                  <span className="text-neutral-700 font-medium text-sm ml-1">
                    {pkg.rating.toFixed(1)}
                  </span>
                  <span className="text-neutral-500 text-xs ml-1">
                    ({pkg.reviewCount || 0} reviews)
                  </span>
                </>
              )}
            </div>
            <div>
              <span className="text-neutral-500 text-xs">Starting from</span>
              <p className="text-lg font-bold">${pkg.price}</p>
            </div>
          </div>
          <Button asChild className="ml-2">
            <Link href={`/checkout?id=${pkg.id}&type=package&name=${encodeURIComponent(pkg.name)}&price=${pkg.price}&image=${encodeURIComponent(pkg.imageUrl)}&duration=${pkg.duration}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
