import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, Globe, Briefcase, BookmarkCheck, User,
} from "lucide-react";
import { ExploreMenu } from "@/components/ui/explore-menu";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);

  // Don't show bottom navigation on admin pages
  if (location.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <ExploreMenu open={exploreMenuOpen} onClose={() => setExploreMenuOpen(false)} />
      
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center z-50 py-2 px-4 md:hidden"
      >
        <Link href="/" className={cn(
          "flex flex-col items-center",
          location === "/" ? "text-primary" : "text-neutral-700"
        )}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <button 
          className={cn(
            "flex flex-col items-center border-0 bg-transparent",
            (exploreMenuOpen || location === "/destinations" || location === "/hotels" || 
             location === "/cruises" || location === "/cabs" || location === "/events") 
              ? "text-primary" : "text-neutral-700"
          )}
          onClick={() => setExploreMenuOpen(true)}
        >
          <Globe className="h-5 w-5" />
          <span className="text-xs mt-1">Explore</span>
        </button>
        
        <Link href="/packages" className={cn(
          "flex flex-col items-center",
          location === "/packages" ? "text-primary" : "text-neutral-700"
        )}>
          <Briefcase className="h-5 w-5" />
          <span className="text-xs mt-1">Packages</span>
        </Link>
        
        <Link href={user ? "/bookings" : "/auth"} className={cn(
          "flex flex-col items-center",
          location === "/bookings" ? "text-primary" : "text-neutral-700"
        )}>
          <BookmarkCheck className="h-5 w-5" />
          <span className="text-xs mt-1">Bookings</span>
        </Link>
        
        <Link href={user ? "/profile" : "/auth"} className={cn(
          "flex flex-col items-center",
          location === "/profile" || location === "/auth" ? "text-primary" : "text-neutral-700"
        )}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </>
  );
}

export default BottomNavigation;
