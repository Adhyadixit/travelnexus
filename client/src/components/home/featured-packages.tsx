import { useQuery } from "@tanstack/react-query";
import { Package, Destination } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import PackageCard from "@/components/cards/package-card";

export default function FeaturedPackages() {
  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });
  
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  const isLoading = packagesLoading || destinationsLoading;

  // Get top 3 packages by rating
  const featuredPackages = packages
    ?.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  return (
    <section className="py-10 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Featured Packages</h2>
          <Link href="/packages">
            <a className="text-primary font-medium hidden md:block hover:underline">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : featuredPackages && featuredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPackages.map((pkg) => {
              const destination = destinations?.find(d => d.id === pkg.destinationId);
              
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  destinationName={destination?.name || ""}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-500">No packages available at the moment. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-6 text-center md:hidden">
          <Link href="/packages">
            <a className="text-primary font-medium">View All Packages</a>
          </Link>
        </div>
      </div>
    </section>
  );
}
