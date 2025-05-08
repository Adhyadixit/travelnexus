import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Driver } from "@shared/schema";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, MapPinIcon, CarIcon, LanguagesIcon, Star } from "lucide-react";
import { format, addDays } from "date-fns";

export default function CabDetails() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // State for booking
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [days, setDays] = useState(1);
  
  // Fetch driver details
  const { 
    data: driver,
    isLoading
  } = useQuery<Driver>({
    queryKey: [`/api/drivers/${id}`],
  });
  
  // Handle booking
  const handleBookNow = () => {
    if (!user) {
      setLocation(`/auth?redirect=/cabs/${id}`);
      return;
    }
    
    if (!startDate || !endDate) {
      return;
    }
    
    setLocation(`/checkout/driver/${id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&guests=1`);
  };
  
  // Update end date when start date or days change
  const updateEndDate = (date: Date | undefined, dayCount: number) => {
    if (!date) return;
    setStartDate(date);
    setEndDate(addDays(date, dayCount));
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    return days * (driver?.dailyRate || 0);
  };
  
  const totalPrice = calculateTotalPrice();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-80 w-full rounded-xl" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-full max-w-2xl" />
              <Skeleton className="h-6 w-full max-w-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Driver Not Found</h1>
          <p className="mb-8">The driver you're looking for doesn't exist or is unavailable.</p>
          <Link href="/cabs">
            <Button>Browse All Drivers</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            <div className="rounded-xl overflow-hidden mb-6">
              <img 
                src={driver.imageUrl} 
                alt={`${driver.name}'s car - ${driver.carModel}`} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            <div className="flex items-center mb-6">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarImage src={driver.profileImageUrl} alt={driver.name} />
                <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-heading font-bold">{driver.name}</h1>
                <div className="flex items-center">
                  <Star className="text-secondary w-4 h-4 fill-current mr-1" />
                  <span className="font-medium">{driver.rating?.toFixed(1) || "New"}</span>
                  {driver.reviewCount > 0 && (
                    <span className="text-neutral-500 text-sm ml-2">({driver.reviewCount} reviews)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center mb-2">
                  <CarIcon className="text-primary w-5 h-5 mr-2" />
                  <h3 className="font-heading font-semibold">Vehicle</h3>
                </div>
                <p className="text-neutral-600">{driver.carModel}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center mb-2">
                  <LanguagesIcon className="text-primary w-5 h-5 mr-2" />
                  <h3 className="font-heading font-semibold">Languages</h3>
                </div>
                <p className="text-neutral-600">{driver.languages}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center mb-2">
                  <MapPinIcon className="text-primary w-5 h-5 mr-2" />
                  <h3 className="font-heading font-semibold">Location</h3>
                </div>
                <p className="text-neutral-600">
                  {driver.destinationId ? "Local Driver" : "International Driver"}
                </p>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold mb-4">About The Driver</h2>
                <p className="text-neutral-600">
                  {driver.name} is a professional driver with extensive experience navigating the local area. 
                  Fluent in {driver.languages}, they provide excellent service and local knowledge to ensure 
                  a comfortable and informative travel experience for all passengers.
                </p>
              </div>
              
              <div>
                <h2 className="text-xl font-heading font-bold mb-4">Services Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["Airport Transfers", "Day Tours", "Multi-day Excursions", 
                    "Business Travel", "Special Events", "Nightlife Transportation", 
                    "Shopping Tours", "Custom Itineraries"].map((service, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-heading font-bold mb-4">Vehicle Information</h2>
                <div className="bg-white p-5 rounded-lg border border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Model</h3>
                      <p className="text-neutral-600">{driver.carModel}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Features</h3>
                      <p className="text-neutral-600">
                        Air conditioning, Wi-Fi, Bottled water, Comfortable seating
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Capacity</h3>
                      <p className="text-neutral-600">Up to 4 passengers</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Additional</h3>
                      <p className="text-neutral-600">Child seats available upon request</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-bold mb-4">Book This Driver</h2>
                
                <div className="space-y-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg mb-4">
                    <div className="text-lg font-heading font-bold">{formatCurrency(driver.dailyRate)}</div>
                    <div className="text-sm text-neutral-500">per day</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          {startDate ? (
                            format(startDate, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => updateEndDate(date, days)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Days</label>
                    <Select 
                      value={days.toString()} 
                      onValueChange={(value) => {
                        const dayCount = parseInt(value);
                        setDays(dayCount);
                        if (startDate) {
                          updateEndDate(startDate, dayCount);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                          <SelectItem key={d} value={d.toString()}>
                            {d} {d === 1 ? "day" : "days"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {startDate && endDate && (
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <div className="bg-neutral-50 p-3 rounded-lg border text-neutral-500">
                        {format(endDate, "PPP")}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{formatCurrency(driver.dailyRate)} x {days} days</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!startDate || !endDate}
                  >
                    Book Driver
                  </Button>
                  
                  <p className="text-xs text-neutral-500 text-center">
                    Fuel costs and tolls are not included in the daily rate.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-2">Driver's Policy</h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>• 24-hour cancellation required for a full refund</p>
                  <p>• Driver is available for up to 10 hours per day</p>
                  <p>• Additional hours will be charged extra</p>
                  <p>• Waiting time is included in the daily rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
