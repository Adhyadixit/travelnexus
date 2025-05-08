import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PackageOpen,
  Building2,
  Car,
  Ship,
  BookText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const adminMenuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Packages",
      href: "/admin/packages",
      icon: PackageOpen,
    },
    {
      title: "Hotels",
      href: "/admin/hotels",
      icon: Building2,
    },
    {
      title: "Cabs",
      href: "/admin/cabs",
      icon: Car,
    },
    {
      title: "Cruises",
      href: "/admin/cruises",
      icon: Ship,
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: BookText,
    },
  ];

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-border h-screen transition-all duration-300 relative flex flex-col",
        collapsed ? "w-[70px]" : "w-[250px]",
        className
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1
          className={cn(
            "text-xl font-bold text-primary transition-opacity duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}
        >
          TravelEase<span className="text-secondary">.</span>
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {adminMenuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                      )}
                    >
                      {item.title}
                    </span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
            collapsed ? "justify-center" : ""
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
          <span
            className={cn(
              "transition-opacity duration-300",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}
