import { Link } from "wouter";
import { Cruise } from "@shared/schema";
import { formatCurrency, truncateText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Anchor, Star } from "lucide-react";

interface CruiseCardProps {
  cruise: Cruise;
  className?: string;
}

export function CruiseCard({ cruise, className }: CruiseCardProps) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <Link href={`/cruises/${cruise.id}`}>
        <a className="block">
          <img 
            src={cruise.imageUrl} 
            alt={cruise.name} 
            className="w-full h-48 md:h-60 object-cover"
          />
        </a>
      </Link>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/cruises/${cruise.id}`}>
            <a className="block">
              <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                {cruise.name}
              </h3>
            </a>
          </Link>
          {cruise.featured && (
            <Badge variant="secondary" className="bg-accent">Luxury</Badge>
          )}
        </div>
        
        <p className="text-neutral-600 mb-4 text-sm">{truncateText(cruise.description, 100)}</p>
        
        <div className="flex items-center mb-3">
          <Anchor className="text-neutral-500 w-4 h-4 mr-1" />
          <span className="text-neutral-500 text-sm">{cruise.company}</span>
        </div>
        
        <div className="flex items-center mb-4">
          <Star className="text-secondary w-4 h-4 fill-current mr-1" />
          <span className="text-neutral-700 font-medium text-sm">{cruise.rating?.toFixed(1) || "New"}</span>
          {cruise.reviewCount > 0 && (
            <span className="text-neutral-500 text-sm ml-1">({cruise.reviewCount} reviews)</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Starting from</span>
            <p className="text-lg font-heading font-bold">{formatCurrency(cruise.price)}</p>
            <span className="text-neutral-500 text-xs">per person</span>
          </div>
          <Link href={`/cruises/${cruise.id}`}>
            <Button size="sm">Book Cruise</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
