import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Package, 
  Building, 
  Car, 
  Ship, 
  CalendarDays, 
  BookmarkIcon, 
  Settings, 
  LogOut,
  Compass
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation('/');
  };
  
  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "Destinations",
      href: "/admin/destinations",
      icon: <Compass className="h-5 w-5" />
    },
    {
      title: "Packages",
      href: "/admin/packages",
      icon: <Package className="h-5 w-5" />
    },
    {
      title: "Hotels",
      href: "/admin/hotels",
      icon: <Building className="h-5 w-5" />
    },
    {
      title: "Cabs",
      href: "/admin/cabs",
      icon: <Car className="h-5 w-5" />
    },
    {
      title: "Cruises",
      href: "/admin/cruises",
      icon: <Ship className="h-5 w-5" />
    },
    {
      title: "Events",
      href: "/admin/events",
      icon: <CalendarDays className="h-5 w-5" />
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: <BookmarkIcon className="h-5 w-5" />
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ];
  
  return (
    <div className="h-full border-r bg-white flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">TE</span>
          </div>
          <span className="font-heading font-bold text-xl">Travel Ease by Expedia</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location === item.href && "bg-muted"
                )}
              >
                {item.icon}
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}