import { useQuery } from "@tanstack/react-query";
import { Cab, Destination } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import CabCard from "@/components/cards/cab-card";

export default function CabSection() {
  const { data: cabs, isLoading: cabsLoading } = useQuery<Cab[]>({
    queryKey: ["/api/cabs"],
  });
  
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  const isLoading = cabsLoading || destinationsLoading;

  // Get top 4 drivers by rating
  const featuredCabs = cabs
    ?.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Private Drivers</h2>
          <Link href="/cabs">
            <a className="text-primary font-medium hidden md:block hover:underline">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : featuredCabs && featuredCabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCabs.map((cab) => {
              const destination = destinations?.find(d => d.id === cab.destinationId);
              
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
          <div className="text-center py-10">
            <p className="text-neutral-500">No private drivers available at the moment. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-6 text-center md:hidden">
          <Link href="/cabs">
            <a className="text-primary font-medium">View All Drivers</a>
          </Link>
        </div>
      </div>
    </section>
  );
}
