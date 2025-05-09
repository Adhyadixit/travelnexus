import { Link } from "wouter";
import { Package } from "@shared/schema";
import { formatCurrency, parseIncludedItems, truncateText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface PackageCardProps {
  package: Package;
  className?: string;
}

export function PackageCard({ package: pkg, className }: PackageCardProps) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <Link href={`/packages/${pkg.id}`} className="block">
        <img 
          src={pkg.imageUrl} 
          alt={pkg.name} 
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/packages/${pkg.id}`} className="block">
            <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
              {pkg.name}
            </h3>
          </Link>
          {pkg.trending && (
            <Badge variant="secondary" className="bg-primary-light">Trending</Badge>
          )}
          {pkg.featured && !pkg.trending && (
            <Badge variant="secondary" className="bg-accent">Featured</Badge>
          )}
        </div>
        <p className="text-neutral-600 mb-4 text-sm">{truncateText(pkg.description, 100)}</p>
        
        <div className="flex items-center mb-4">
          <Star className="text-secondary w-4 h-4 fill-current mr-1" />
          <span className="text-neutral-700 font-medium text-sm">{pkg.rating?.toFixed(1) || "New"}</span>
          {pkg.reviewCount !== null && pkg.reviewCount > 0 && (
            <span className="text-neutral-500 text-sm ml-1">({pkg.reviewCount} reviews)</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Starting from</span>
            <p className="text-lg font-heading font-bold">{formatCurrency(pkg.price)}</p>
          </div>
          <Link href={`/packages/${pkg.id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
