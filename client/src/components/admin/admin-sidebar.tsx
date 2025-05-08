import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart4, 
  Package, 
  Building, 
  Car, 
  Anchor, 
  CalendarDays, 
  BookOpen, 
  UserCog, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu
} from "lucide-react";

interface AdminSidebarProps {
  mobile?: boolean;
}

export function AdminSidebar({ mobile = false }: AdminSidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <BarChart4 className="w-5 h-5" />,
    },
    {
      title: "Packages",
      href: "/admin/packages",
      icon: <Package className="w-5 h-5" />,
    },
    {
      title: "Hotels",
      href: "/admin/hotels",
      icon: <Building className="w-5 h-5" />,
    },
    {
      title: "Drivers",
      href: "/admin/cabs",
      icon: <Car className="w-5 h-5" />,
    },
    {
      title: "Cruises",
      href: "/admin/cruises",
      icon: <Anchor className="w-5 h-5" />,
    },
    {
      title: "Events",
      href: "/admin/events",
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  const Content = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/admin/dashboard">
          <a className="flex items-center">
            <h1 className="text-xl font-heading font-bold text-primary">
              TravelEase<span className="text-secondary">.</span>
            </h1>
            <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded ml-2">
              Admin
            </span>
          </a>
        </Link>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary/10 text-neutral-700 hover:text-secondary"
              )}>
                {item.icon}
                {item.title}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4">
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                <span>Settings</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                settingsOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-6 pt-2 space-y-1">
              <Link href="/admin/profile">
                <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary/10 text-neutral-700 hover:text-secondary">
                  <UserCog className="h-5 w-5" />
                  Admin Profile
                </a>
              </Link>
              <Button 
                variant="ghost" 
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary/10 text-neutral-700 hover:text-secondary justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-white">
      {Content}
    </div>
  );
}
