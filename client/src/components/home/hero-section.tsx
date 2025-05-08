import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Search } from "lucide-react";
import { Destination } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [destination, setDestination] = useState<string>("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [travelers, setTravelers] = useState<string>("2 Adults");
  const [, navigate] = useLocation();
  
  const { data: destinations } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  const handleSearch = () => {
    // Navigate to packages page with filters
    navigate(`/packages?destination=${destination}&checkIn=${checkIn?.toISOString()}&checkOut=${checkOut?.toISOString()}&travelers=${travelers}`);
  };

  return (
    <section className="search-container w-full h-80 md:h-96 flex items-center justify-center text-neutral-800">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">Explore the World with Us</h1>
        <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto text-neutral-800">
          Discover amazing destinations, book your perfect stay, and create unforgettable memories.
        </p>
        
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-neutral-600 text-sm font-medium mb-1">Destination</label>
              <Select onValueChange={setDestination} value={destination}>
                <SelectTrigger>
                  <SelectValue placeholder="Where to?" />
                </SelectTrigger>
                <SelectContent className="text-neutral-800">
                  <SelectItem value="" className="text-neutral-800">All Destinations</SelectItem>
                  {destinations?.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id.toString()} className="text-neutral-800">
                      {dest.name}, {dest.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <label className="block text-neutral-600 text-sm font-medium mb-1">Check-in</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 text-neutral-800">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="text-neutral-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="relative">
              <label className="block text-neutral-600 text-sm font-medium mb-1">Check-out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 text-neutral-800">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    initialFocus
                    disabled={(date) => date < (checkIn || new Date())}
                    className="text-neutral-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="relative">
              <label className="block text-neutral-600 text-sm font-medium mb-1">Travelers</label>
              <Select onValueChange={setTravelers} defaultValue="2 Adults">
                <SelectTrigger>
                  <SelectValue placeholder="2 Adults" />
                </SelectTrigger>
                <SelectContent className="text-neutral-800">
                  <SelectItem value="1 Adult" className="text-neutral-800">1 Adult</SelectItem>
                  <SelectItem value="2 Adults" className="text-neutral-800">2 Adults</SelectItem>
                  <SelectItem value="2 Adults, 1 Child" className="text-neutral-800">2 Adults, 1 Child</SelectItem>
                  <SelectItem value="2 Adults, 2 Children" className="text-neutral-800">2 Adults, 2 Children</SelectItem>
                  <SelectItem value="3 Adults" className="text-neutral-800">3 Adults</SelectItem>
                  <SelectItem value="4 Adults" className="text-neutral-800">4 Adults</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              className="px-8 py-3 bg-secondary text-neutral-800 font-medium hover:bg-secondary-dark transition-colors flex items-center"
              onClick={handleSearch}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
