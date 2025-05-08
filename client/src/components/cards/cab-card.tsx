import { Link } from "wouter";
import { Cab } from "@shared/schema";
import { Star, MapPin, Car, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CabCardProps {
  cab: Cab;
  destinationName: string;
  destinationCountry: string;
}

export default function CabCard({ cab, destinationName, destinationCountry }: CabCardProps) {
  // Helper function to parse languages from JSON
  const getLanguages = () => {
    try {
      const langs = cab.languages as string[];
      return langs.join(", ");
    } catch (error) {
      return "English";
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={cab.vehicleImageUrl} 
        alt={`${cab.driverName}'s ${cab.vehicleModel}`} 
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center mb-3">
          <Avatar className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-neutral-200">
            <AvatarImage src={cab.profileImageUrl} alt={cab.driverName} />
            <AvatarFallback>{cab.driverName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-heading font-semibold">{cab.driverName}</h3>
            <div className="flex items-center">
              <Star className="text-secondary h-4 w-4 mr-1 fill-current" />
              <span className="text-neutral-700 font-medium text-sm">{cab.rating?.toFixed(1) || "New"}</span>
              {cab.reviewCount != null && cab.reviewCount > 0 && (
                <span className="text-neutral-500 text-xs ml-1">({cab.reviewCount})</span>
              )}
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <MapPin className="text-neutral-500 h-4 w-4 mr-1" />
            <span className="text-neutral-500 text-sm">{destinationName}, {destinationCountry}</span>
          </div>
          <div className="flex items-center mb-1">
            <Car className="text-neutral-500 h-4 w-4 mr-1" />
            <span className="text-neutral-500 text-sm">{cab.vehicleModel}</span>
          </div>
          <div className="flex items-center">
            <Globe className="text-neutral-500 h-4 w-4 mr-1" />
            <span className="text-neutral-500 text-sm">{getLanguages()}</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-neutral-500 text-xs">Daily rate</span>
            <p className="text-lg font-heading font-bold">${cab.dailyRate.toLocaleString()}</p>
          </div>
          <Link href={`/cabs/${cab.id}`}>
            <Button size="sm" className="bg-primary text-neutral-800 hover:bg-primary-dark transition-colors font-medium">
              Book Driver
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
