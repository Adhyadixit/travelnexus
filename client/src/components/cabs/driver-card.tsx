import { Link } from "wouter";
import { Driver } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Car, Languages, Star } from "lucide-react";

interface DriverCardProps {
  driver: Driver;
  className?: string;
}

export function DriverCard({ driver, className }: DriverCardProps) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <Link href={`/cabs/${driver.id}`}>
        <a className="block">
          <img 
            src={driver.imageUrl} 
            alt={`${driver.name}'s car`} 
            className="w-full h-40 object-cover"
          />
        </a>
      </Link>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-neutral-200">
            <img 
              src={driver.profileImageUrl} 
              alt={`${driver.name}`} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <Link href={`/cabs/${driver.id}`}>
              <a className="block">
                <h3 className="font-heading font-semibold hover:text-primary transition-colors">
                  {driver.name}
                </h3>
              </a>
            </Link>
            <div className="flex items-center">
              <Star className="text-secondary w-3 h-3 fill-current mr-1" />
              <span className="text-neutral-700 font-medium text-sm">
                {driver.rating?.toFixed(1) || "New"}
              </span>
              {driver.reviewCount > 0 && (
                <span className="text-neutral-500 text-xs ml-1">({driver.reviewCount})</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <MapPin className="text-neutral-500 w-3 h-3 mr-1" />
            <span className="text-neutral-500 text-sm">Dubai, UAE</span>
          </div>
          <div className="flex items-center mb-1">
            <Car className="text-neutral-500 w-3 h-3 mr-1" />
            <span className="text-neutral-500 text-sm">{driver.carModel}</span>
          </div>
          <div className="flex items-center">
            <Languages className="text-neutral-500 w-3 h-3 mr-1" />
            <span className="text-neutral-500 text-sm">{driver.languages}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-neutral-500 text-xs">Daily rate</span>
            <p className="text-lg font-heading font-bold">{formatCurrency(driver.dailyRate)}</p>
          </div>
          <Link href={`/cabs/${driver.id}`}>
            <Button size="sm">Book Driver</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
