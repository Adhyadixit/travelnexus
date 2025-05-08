import { useQuery } from "@tanstack/react-query";
import { Destination } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import DestinationCard from "@/components/cards/destination-card";

export default function PopularDestinations() {
  const { data: destinations, isLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Popular Destinations</h2>
          <Link href="/destinations">
            <a className="text-primary font-medium hidden md:block hover:underline">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : destinations && destinations.length > 0 ? (
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4 pb-4 min-w-max md:grid md:grid-cols-5 md:gap-4 md:space-x-0">
              {destinations.slice(0, 5).map((destination) => (
                <DestinationCard 
                  key={destination.id} 
                  destination={destination} 
                  className="w-40 md:w-auto"
                />
              ))}
            </div>
            <div className="mt-4 text-center md:hidden">
              <Link href="/destinations">
                <a className="text-primary font-medium">View All Destinations</a>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-500">No destinations available at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
