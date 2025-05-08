import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Driver } from '@shared/schema';
import { Search, Star, MapPin, Car, Globe, Filter, Loader2 } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CabPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState<string>('price-low');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  
  // Fetch all drivers
  const { data: drivers, isLoading, error } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  // Filter drivers
  const filteredDrivers = drivers?.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.carType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.languages.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = 
      driver.dailyRate >= priceRange[0] && 
      driver.dailyRate <= priceRange[1];
    
    const matchesAvailability = 
      !onlyAvailable || driver.available;
    
    return matchesSearch && matchesPrice && matchesAvailability;
  });

  // Sort drivers
  const sortedDrivers = [...(filteredDrivers || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.dailyRate - b.dailyRate;
      case 'price-high':
        return b.dailyRate - a.dailyRate;
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
    setPriceRange([0, 500]);
    setSortBy('price-low');
    setOnlyAvailable(true);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to load drivers</h2>
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

  // Get max price for the slider
  const maxPrice = drivers ? Math.max(...drivers.map(driver => driver.dailyRate)) : 500;

  return (
    <>
      <Helmet>
        <title>Private Drivers & Cabs - TravelEase</title>
        <meta name="description" content="Book professional drivers and private cabs for your international travel. Explore our selection of experienced local drivers with luxury vehicles." />
        <meta property="og:title" content="Private Drivers & Cabs - TravelEase" />
        <meta property="og:description" content="Book professional drivers and private cabs for your international travel. Explore our selection of experienced local drivers." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero section */}
          <section className="bg-primary text-white py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Book Professional Drivers</h1>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Explore with comfort and ease with our experienced local drivers
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search by driver name, car type, or languages..." 
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
                      <h3 className="font-medium mb-2">Daily Rate</h3>
                      <div className="px-2">
                        <Slider 
                          defaultValue={[0, maxPrice]} 
                          max={maxPrice}
                          step={10}
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
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="available" 
                          checked={onlyAvailable}
                          onCheckedChange={(checked) => {
                            setOnlyAvailable(checked as boolean);
                          }}
                        />
                        <label 
                          htmlFor="available"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Show only available drivers
                        </label>
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
                
                {/* Drivers list */}
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
                            Refine your driver search
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Daily Rate</h3>
                          <div className="px-2">
                            <Slider 
                              defaultValue={[0, maxPrice]} 
                              max={maxPrice}
                              step={10}
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
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="available-mobile" 
                              checked={onlyAvailable}
                              onCheckedChange={(checked) => {
                                setOnlyAvailable(checked as boolean);
                              }}
                            />
                            <label 
                              htmlFor="available-mobile"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Show only available drivers
                            </label>
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
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort by (desktop) */}
                  <div className="hidden md:flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                      {sortedDrivers?.length} Drivers Found
                    </h2>
                    <div className="flex items-center">
                      <span className="mr-2 text-neutral-500">Sort by:</span>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedDrivers?.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h3 className="text-xl font-semibold mb-2">No drivers found</h3>
                      <p className="text-neutral-600 mb-4">
                        Try adjusting your filters or search for different keywords
                      </p>
                      <Button onClick={resetFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedDrivers?.map(driver => (
                        <DriverCard key={driver.id} driver={driver} />
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

function DriverCard({ driver }: { driver: Driver }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={driver.imageUrl} 
        alt={`${driver.name}'s vehicle`} 
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-neutral-200">
            <Avatar>
              <AvatarImage src={driver.profileImage} alt={driver.name} />
              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="font-semibold">{driver.name}</h3>
            <div className="flex items-center">
              <Star className="text-secondary mr-1 h-3 w-3 fill-current" />
              <span className="text-neutral-700 font-medium text-sm">{driver.rating?.toFixed(1) || '4.8'}</span>
              <span className="text-neutral-500 text-xs ml-1">
                ({driver.reviewCount || '0'})
              </span>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <MapPin className="text-neutral-500 mr-1 h-4 w-4" />
            <span className="text-neutral-500 text-sm">Destination ID: {driver.destinationId}</span>
          </div>
          <div className="flex items-center mb-1">
            <Car className="text-neutral-500 mr-1 h-4 w-4" />
            <span className="text-neutral-500 text-sm">{driver.carType}</span>
          </div>
          <div className="flex items-center">
            <Globe className="text-neutral-500 mr-1 h-4 w-4" />
            <span className="text-neutral-500 text-sm">{driver.languages}</span>
          </div>
        </div>
        
        {!driver.available && (
          <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium mb-3">
            Currently unavailable
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-neutral-500 text-xs">Daily rate</span>
            <p className="text-lg font-bold">${driver.dailyRate.toFixed(0)}</p>
          </div>
          <Button 
            asChild 
            className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
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
      </div>
    </div>
  );
}
