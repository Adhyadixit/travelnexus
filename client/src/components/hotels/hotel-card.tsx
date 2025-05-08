import { Link } from "wouter";
import { Hotel } from "@shared/schema";
import { formatCurrency, truncateText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";

interface HotelCardProps {
  hotel: Hotel;
  className?: string;
}

export function HotelCard({ hotel, className }: HotelCardProps) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <Link href={`/hotels/${hotel.id}`}>
        <a className="block">
          <img 
            src={hotel.imageUrl} 
            alt={hotel.name} 
            className="w-full h-48 object-cover"
          />
        </a>
      </Link>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/hotels/${hotel.id}`}>
            <a className="block">
              <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                {hotel.name}
              </h3>
            </a>
          </Link>
          <div className="flex">
            {[...Array(hotel.rating)].map((_, i) => (
              <Star key={i} className="text-secondary w-4 h-4 fill-current" />
            ))}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <MapPin className="text-neutral-500 w-4 h-4 mr-1" />
          <span className="text-neutral-500 text-sm">{hotel.address}</span>
        </div>
        
        <p className="text-neutral-600 mb-4 text-sm">{truncateText(hotel.description, 100)}</p>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Per night from</span>
            <p className="text-lg font-heading font-bold">{formatCurrency(hotel.price)}</p>
          </div>
          <Link href={`/hotels/${hotel.id}`}>
            <Button size="sm">Book Now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
