import { useQuery } from "@tanstack/react-query";
import { Cruise } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import CruiseCard from "@/components/cards/cruise-card";

export default function CruiseSection() {
  const { data: cruises, isLoading } = useQuery<Cruise[]>({
    queryKey: ["/api/cruises"],
  });

  // Get top 2 cruises by rating
  const featuredCruises = cruises
    ?.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 2);

  return (
    <section className="py-10 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Cruise Adventures</h2>
          <Link href="/cruises">
            <a className="text-primary font-medium hidden md:block hover:underline">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : featuredCruises && featuredCruises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredCruises.map((cruise) => (
              <CruiseCard key={cruise.id} cruise={cruise} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-500">No cruises available at the moment. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-6 text-center md:hidden">
          <Link href="/cruises">
            <a className="text-primary font-medium">View All Cruises</a>
          </Link>
        </div>
      </div>
    </section>
  );
}
