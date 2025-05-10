import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Compass, 
  Hotel, 
  Package, 
  Car, 
  Ship, 
  CalendarDays, 
  BookOpen, 
  LogOut,
  Users,
  MessageSquare
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/destinations", label: "Destinations", icon: Compass },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/hotels", label: "Hotels", icon: Hotel },
  { href: "/admin/drivers", label: "Drivers", icon: Car },
  { href: "/admin/cruises", label: "Cruises", icon: Ship },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/reviews", label: "Reviews", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 hidden md:flex md:flex-col h-screen">
        <div className="flex items-center justify-center p-4">
          <h1 className="text-xl font-bold text-primary">Travel Ease by Expedia Admin</h1>
        </div>
        
        <nav className="mt-6 space-y-1 flex-grow overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <div key={item.href}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow z-10 md:hidden">
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg font-bold text-primary">TravelEase Admin</h1>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}