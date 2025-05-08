import { useQuery } from "@tanstack/react-query";
import { Hotel, Destination } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import HotelCard from "@/components/cards/hotel-card";

export default function HotelSection() {
  const { data: hotels, isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });
  
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  const isLoading = hotelsLoading || destinationsLoading;

  // Get top 3 luxury hotels
  const featuredHotels = hotels
    ?.filter(hotel => hotel.rating >= 5)
    .sort((a, b) => b.pricePerNight - a.pricePerNight)
    .slice(0, 3);

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Luxury Hotels</h2>
          <Link href="/hotels">
            <a className="text-primary font-medium hidden md:block hover:underline">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : featuredHotels && featuredHotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHotels.map((hotel) => {
              const destination = destinations?.find(d => d.id === hotel.destinationId);
              
              return (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  destinationName={destination?.name || ""}
                  destinationCountry={destination?.country || ""}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-500">No luxury hotels available at the moment. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-6 text-center md:hidden">
          <Link href="/hotels">
            <a className="text-primary font-medium">View All Hotels</a>
          </Link>
        </div>
      </div>
    </section>
  );
}
