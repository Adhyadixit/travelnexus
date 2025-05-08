import { Link } from "wouter";
import { Destination } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  destination: Destination;
  className?: string;
}

export function DestinationCard({ destination, className }: DestinationCardProps) {
  return (
    <Link href={`/destinations/${destination.id}`}>
      <a className={cn(
        "destination-card rounded-xl overflow-hidden bg-white shadow cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}>
        <div className="h-40 relative">
          <img 
            src={destination.imageUrl} 
            alt={`${destination.name} - ${destination.country}`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3">
            <h3 className="text-white font-heading font-semibold">{destination.name}</h3>
            <p className="text-white text-sm opacity-90">{destination.country}</p>
          </div>
          {destination.featured && (
            <div className="absolute top-2 right-2 bg-secondary text-neutral-800 text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </div>
          )}
        </div>
      </a>
    </Link>
  );
}
