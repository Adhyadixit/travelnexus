import { useState } from "react";
import { 
  Briefcase, Ship, Building2, Car, MapPin, Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ExploreOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export function ExploreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location, navigate] = useLocation();

  const options: ExploreOption[] = [
    {
      id: "packages",
      label: "Tour Packages",
      icon: <Briefcase className="h-6 w-6" />,
      path: "/packages"
    },
    {
      id: "hotels",
      label: "Luxury Hotels",
      icon: <Building2 className="h-6 w-6" />,
      path: "/hotels"
    },
    {
      id: "cruises",
      label: "Cruise Adventures",
      icon: <Ship className="h-6 w-6" />,
      path: "/cruises"
    },
    {
      id: "cabs",
      label: "Private Drivers",
      icon: <Car className="h-6 w-6" />,
      path: "/cabs"
    },
    {
      id: "destinations",
      label: "Destinations",
      icon: <MapPin className="h-6 w-6" />,
      path: "/destinations"
    },
    {
      id: "events",
      label: "Local Events",
      icon: <Calendar className="h-6 w-6" />,
      path: "/events"
    }
  ];

  const handleOptionClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-heading font-bold">Explore</h2>
          <p className="text-neutral-500 text-sm">Choose what you want to explore</p>
        </div>
        <div className="grid grid-cols-2 p-4 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              className={`flex flex-col items-center justify-center p-4 rounded-lg hover:bg-neutral-100 border transition-colors
                ${location === option.path 
                  ? "bg-primary/10 border-primary/20" 
                  : "bg-neutral-50 border-neutral-200"}`}
              onClick={() => handleOptionClick(option.path)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2
                ${location === option.path 
                  ? "bg-primary/20 text-primary" 
                  : "bg-primary/10 text-primary"}`}>
                {option.icon}
              </div>
              <span className={`text-sm font-medium text-center 
                ${location === option.path ? "text-primary" : ""}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExploreMenu;