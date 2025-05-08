import { Link } from "wouter";
import { Destination } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  destination: Destination;
  className?: string;
}

export default function DestinationCard({ destination, className }: DestinationCardProps) {
  return (
    <Link href={`/destinations/${destination.id}`}>
      <a className={cn("block w-full", className)}>
        <div className="destination-card rounded-xl overflow-hidden bg-white shadow cursor-pointer">
          <div className="aspect-[4/5] relative">
            <img 
              src={destination.imageUrl} 
              alt={`${destination.name}, ${destination.country}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3">
              <h3 className="text-white font-heading font-semibold">{destination.name}</h3>
              <p className="text-white/80 text-sm">{destination.country}</p>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}
