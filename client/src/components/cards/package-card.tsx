import { Link } from "wouter";
import { Package } from "@shared/schema";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PackageCardProps {
  pkg: Package;
  destinationName: string;
}

export default function PackageCard({ pkg, destinationName }: PackageCardProps) {
  // Helper function to determine package status badge
  const getStatusBadge = () => {
    if (pkg.reviewCount != null && pkg.reviewCount > 200) {
      return { label: "Best Seller", color: "bg-secondary" };
    } else if (pkg.price > 1500) {
      return { label: "Premium", color: "bg-accent" };
    } else if (pkg.rating != null && pkg.rating >= 4.8) {
      return { label: "Trending", color: "bg-primary-light" };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={pkg.imageUrl} 
        alt={pkg.name} 
        className="w-full h-48 object-cover"
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-lg">{pkg.name}</h3>
          {statusBadge && (
            <Badge className={`${statusBadge.color} text-neutral-800 font-medium`}>
              {statusBadge.label}
            </Badge>
          )}
        </div>
        <p className="text-neutral-600 mb-4 text-sm line-clamp-2">{pkg.description}</p>
        <div className="flex items-center mb-4">
          <Star className="text-secondary h-4 w-4 mr-1 fill-current" />
          <span className="text-neutral-700 font-medium text-sm">{pkg.rating?.toFixed(1) || "New"}</span>
          {pkg.reviewCount != null && pkg.reviewCount > 0 && (
            <span className="text-neutral-500 text-sm ml-1">({pkg.reviewCount} reviews)</span>
          )}
        </div>
        <div className="flex items-center mb-3 text-sm text-neutral-500">
          <span className="mr-2">• {destinationName}</span>
          <span>• {pkg.duration} days</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-neutral-500 text-xs">Starting from</span>
            <p className="text-lg font-heading font-bold">${pkg.price.toLocaleString()}</p>
          </div>
          <Link href={`/packages/${pkg.id}`}>
            <Button size="sm" className="bg-primary text-neutral-800 hover:bg-primary-dark transition-colors font-medium">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
