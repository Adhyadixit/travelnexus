import { Link } from "wouter";
import { Cruise } from "@shared/schema";
import { Star, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CruiseCardProps {
  cruise: Cruise;
}

export default function CruiseCard({ cruise }: CruiseCardProps) {
  // Helper function to determine cruise status badge
  const getStatusBadge = () => {
    if (cruise.reviewCount && cruise.reviewCount > 150) {
      return { label: "Popular", color: "bg-secondary" };
    } else if (cruise.price > 2000) {
      return { label: "Luxury", color: "bg-accent" };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={cruise.imageUrl} 
        alt={cruise.name} 
        className="w-full h-48 md:h-60 object-cover"
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-lg">{cruise.name}</h3>
          {statusBadge && (
            <Badge className={`${statusBadge.color} text-white`}>
              {statusBadge.label}
            </Badge>
          )}
        </div>
        <p className="text-neutral-600 mb-4 text-sm line-clamp-2">{cruise.description}</p>
        <div className="flex items-center mb-3">
          <Ship className="text-neutral-500 h-4 w-4 mr-1" />
          <span className="text-neutral-500 text-sm">{cruise.company}</span>
        </div>
        <div className="flex flex-col gap-1 mb-3 text-sm text-neutral-500">
          <div>• {cruise.duration} days - {cruise.route}</div>
          {cruise.departureDate && (
            <div>• Departure: {format(new Date(cruise.departureDate), 'MMM d, yyyy')}</div>
          )}
        </div>
        <div className="flex items-center mb-4">
          <Star className="text-secondary h-4 w-4 mr-1 fill-current" />
          <span className="text-neutral-700 font-medium text-sm">{cruise.rating?.toFixed(1) || "New"}</span>
          {cruise.reviewCount > 0 && (
            <span className="text-neutral-500 text-sm ml-1">({cruise.reviewCount} reviews)</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Starting from</span>
            <p className="text-lg font-heading font-bold">${cruise.price.toLocaleString()}</p>
            <span className="text-neutral-500 text-xs">per person</span>
          </div>
          <Link href={`/cruises/${cruise.id}`}>
            <Button size="sm" className="bg-primary text-white hover:bg-primary-dark transition-colors">
              Book Cruise
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
