import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Hotel } from '@shared/schema';
import { Search, Star, MapPin, Wifi, Dumbbell, Utensils, Car, Coffee, PawPrint, ArrowUpDown, Loader2 } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

export default function HotelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('price-low');
  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  
  // Fetch all hotels
  const { data: hotels, isLoading, error } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Filter hotels based on search and filters
  const filteredHotels = hotels?.filter(hotel => {
    const matchesSearch = 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = 
      hotel.pricePerNight >= priceRange[0] && 
      hotel.pricePerNight <= priceRange[1];
    
    const matchesStars = 
      selectedStars === null || hotel.stars === selectedStars;
    
    return matchesSearch && matchesPrice && matchesStars;
  });

  // Sort hotels
  const sortedHotels = [...(filteredHotels || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.pricePerNight - b.pricePerNight;
      case 'price-high':
        return b.pricePerNight - a.pricePerNight;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'stars':
        return b.stars - a.stars;
      default:
        return 0;
    }
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle price range slider change
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
  };

  // Handle star rating filter
  const handleStarFilterChange = (stars: number | null) => {
    setSelectedStars(stars === selectedStars ? null : stars);
  };

  // Handle sort selection
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to load hotels</h2>
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
  const maxPrice = hotels ? Math.max(...hotels.map(hotel => hotel.pricePerNight)) : 1000;

  return (
    <>
      <Helmet>
        <title>Luxury Hotels Worldwide - TravelEase</title>
        <meta name="description" content="Find and book the best luxury hotels worldwide. Explore our selection of 5-star accommodations with amazing amenities and world-class service." />
        <meta property="og:title" content="Luxury Hotels Worldwide - TravelEase" />
        <meta property="og:description" content="Find and book the best luxury hotels worldwide. Explore our selection of 5-star accommodations with amazing amenities." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero section */}
          <section className="bg-primary text-white py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Discover luxury hotels worldwide with exceptional amenities and services
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search hotels by name or location..." 
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
                      <h3 className="font-medium mb-2">Price per night</h3>
                      <div className="px-2">
                        <Slider 
                          defaultValue={[0, maxPrice]} 
                          max={maxPrice}
                          step={10}
                          onValueChange={handlePriceRangeChange}
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
                      <h3 className="font-medium mb-3">Star Rating</h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => (
                          <button
                            key={stars}
                            onClick={() => handleStarFilterChange(stars)}
                            className={`flex items-center w-full px-2 py-1.5 rounded-md ${
                              selectedStars === stars ? 'bg-primary-light/10 text-primary' : 'hover:bg-neutral-100'
                            }`}
                          >
                            <div className="flex">
                              {Array(stars).fill(0).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${selectedStars === stars ? 'fill-primary text-primary' : 'fill-secondary text-secondary'}`}
                                />
                              ))}
                            </div>
                            <span className="ml-2">{stars} Stars</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator className="mb-6" />
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSearchTerm('');
                        setPriceRange([0, maxPrice]);
                        setSelectedStars(null);
                        setSortBy('price-low');
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
                
                {/* Hotels list */}
                <div className="md:col-span-3">
                  {/* Mobile filters button */}
                  <div className="md:hidden mb-4 flex justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 mr-2">
                          Filters
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Filters</DialogTitle>
                          <DialogDescription>
                            Refine your hotel search
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Price per night</h3>
                          <div className="px-2">
                            <Slider 
                              defaultValue={[0, maxPrice]} 
                              max={maxPrice}
                              step={10}
                              onValueChange={handlePriceRangeChange}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-neutral-500">
                              <span>${priceRange[0]}</span>
                              <span>${priceRange[1]}</span>
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <h3 className="font-medium mb-3">Star Rating</h3>
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map(stars => (
                              <button
                                key={stars}
                                onClick={() => handleStarFilterChange(stars)}
                                className={`flex items-center w-full px-2 py-1.5 rounded-md ${
                                  selectedStars === stars ? 'bg-primary-light/10 text-primary' : 'hover:bg-neutral-100'
                                }`}
                              >
                                <div className="flex">
                                  {Array(stars).fill(0).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${selectedStars === stars ? 'fill-primary text-primary' : 'fill-secondary text-secondary'}`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-2">{stars} Stars</span>
                              </button>
                            ))}
                          </div>
                          
                          <div className="mt-6">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                setSearchTerm('');
                                setPriceRange([0, maxPrice]);
                                setSelectedStars(null);
                                setSortBy('price-low');
                              }}
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
                        <SelectItem value="stars">Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort by (desktop) */}
                  <div className="hidden md:flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                      {sortedHotels?.length} Hotels Found
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
                          <SelectItem value="stars">Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedHotels?.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h3 className="text-xl font-semibold mb-2">No hotels found</h3>
                      <p className="text-neutral-600 mb-4">
                        Try adjusting your filters or search for different keywords
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setPriceRange([0, maxPrice]);
                          setSelectedStars(null);
                          setSortBy('price-low');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sortedHotels?.map(hotel => (
                        <HotelCard key={hotel.id} hotel={hotel} />
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

function HotelCard({ hotel }: { hotel: Hotel }) {
  const amenities = hotel.amenities.split(',').map(item => item.trim());
  
  // Render icons for amenities
  const renderAmenityIcon = (amenity: string) => {
    const lowercaseAmenity = amenity.toLowerCase();
    if (lowercaseAmenity.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (lowercaseAmenity.includes('gym') || lowercaseAmenity.includes('fitness')) return <Dumbbell className="h-4 w-4" />;
    if (lowercaseAmenity.includes('restaurant') || lowercaseAmenity.includes('dining')) return <Utensils className="h-4 w-4" />;
    if (lowercaseAmenity.includes('parking')) return <Car className="h-4 w-4" />;
    if (lowercaseAmenity.includes('breakfast')) return <Coffee className="h-4 w-4" />;
    if (lowercaseAmenity.includes('pet')) return <PawPrint className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 h-48 md:h-auto relative">
          <img 
            src={hotel.imageUrl} 
            alt={hotel.name} 
            className="w-full h-full object-cover"
          />
          {hotel.featured && (
            <div className="absolute top-3 left-3 bg-secondary text-white text-xs px-2 py-1 rounded-full">
              Featured
            </div>
          )}
        </div>
        <div className="p-6 md:w-2/3">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-1">{hotel.name}</h3>
              <div className="flex items-center mb-2">
                <div className="flex mr-2">
                  {Array(hotel.stars).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                {hotel.rating && (
                  <div className="flex items-center text-sm">
                    <span className="bg-secondary-light text-white px-1.5 py-0.5 rounded mr-1 font-medium">
                      {hotel.rating.toFixed(1)}
                    </span>
                    <span className="text-neutral-500">
                      ({hotel.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center text-neutral-500 text-sm mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{hotel.location}</span>
              </div>
            </div>
            <div className="text-right mt-2 md:mt-0">
              <p className="text-sm text-neutral-500">Per night from</p>
              <p className="text-2xl font-bold text-primary">${hotel.pricePerNight}</p>
            </div>
          </div>
          
          <p className="text-neutral-600 mb-4 line-clamp-2">
            {hotel.description}
          </p>
          
          <Accordion type="single" collapsible className="w-full border-t pt-3">
            <AccordionItem value="amenities" className="border-b-0">
              <AccordionTrigger className="py-1">
                <span className="text-sm font-medium">Popular Amenities</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {amenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      {renderAmenityIcon(amenity)}
                      <span className="ml-2">{amenity}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-wrap justify-end mt-2">
            <Button variant="outline" className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2">
              View Details
            </Button>
            <Button asChild>
              <Link href={`/checkout?id=${hotel.id}&type=hotel&name=${encodeURIComponent(hotel.name)}&price=${hotel.pricePerNight}&image=${encodeURIComponent(hotel.imageUrl)}`}>
                Book Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
