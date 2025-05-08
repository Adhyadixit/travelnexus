import { Link } from "wouter";
import { Hotel } from "@shared/schema";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HotelCardProps {
  hotel: Hotel;
  destinationName: string;
  destinationCountry: string;
}

export default function HotelCard({ hotel, destinationName, destinationCountry }: HotelCardProps) {
  // Generate star rating
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < hotel.rating; i++) {
      stars.push(
        <Star key={i} className="text-secondary h-4 w-4 fill-current" />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={hotel.imageUrl} 
        alt={hotel.name} 
        className="w-full h-48 object-cover"
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-lg">{hotel.name}</h3>
          <div className="flex">
            {renderStars()}
          </div>
        </div>
        <div className="flex items-center mb-3">
          <MapPin className="text-neutral-500 h-4 w-4 mr-1" />
          <span className="text-neutral-500 text-sm">{destinationName}, {destinationCountry}</span>
        </div>
        <p className="text-neutral-600 mb-4 text-sm line-clamp-2">{hotel.description}</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Per night from</span>
            <p className="text-lg font-heading font-bold">${hotel.pricePerNight.toLocaleString()}</p>
          </div>
          <Link href={`/hotels/${hotel.id}`}>
            <Button size="sm" className="bg-primary text-white hover:bg-primary-dark transition-colors">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
