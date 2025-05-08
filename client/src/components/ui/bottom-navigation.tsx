import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, Globe, Briefcase, BookmarkCheck, User,
} from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  // Always keep visible on certain pages
  const alwaysVisible = ['/profile'].includes(location);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide on specific pages regardless of scroll
      if (alwaysVisible) {
        setIsVisible(true);
        return;
      }
      
      const currentScrollPos = window.scrollY;
      setIsVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos, alwaysVisible]);

  // Don't show bottom navigation on admin pages
  if (location.startsWith('/admin')) {
    return null;
  }

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center z-50 py-2 px-4 transition-transform duration-300 md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <Link href="/" className={cn(
        "flex flex-col items-center",
        location === "/" ? "text-primary" : "text-neutral-700"
      )}>
        <Home className="h-5 w-5" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      
      <Link href="/destinations" className={cn(
        "flex flex-col items-center",
        location === "/destinations" ? "text-primary" : "text-neutral-700"
      )}>
        <Globe className="h-5 w-5" />
        <span className="text-xs mt-1">Explore</span>
      </Link>
      
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
  );
}

export default BottomNavigation;
