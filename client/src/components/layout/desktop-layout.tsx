import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, Heart, User, LogOut, LogIn, Menu, X, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import ChatWidget from "@/components/chat/chat-widget";

interface DesktopLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  autoOpenChat?: boolean;
  currentConversationId?: number | null;
}

export function DesktopLayout({ 
  children,
  hideNavigation = false,
  autoOpenChat = false,
  currentConversationId = null
}: DesktopLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check if on admin routes
  const isAdminRoute = location.startsWith('/admin');

  // Skip navigation for admin routes
  if (isAdminRoute || hideNavigation) {
    return <div className="flex flex-col min-h-screen bg-neutral-50">{children}</div>;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/hotels", label: "Hotels" },
    { href: "/packages", label: "Packages" },
    { href: "/cruises", label: "Cruises" },
    { href: "/cabs", label: "Cabs" },
    { href: "/events", label: "Events" },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-heading font-bold text-primary">
              TravelEase<span className="text-secondary">.</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6 ml-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "font-medium transition-colors",
                    location === link.href
                      ? "text-primary"
                      : "text-neutral-700 hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-neutral-700 hover:text-primary">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-neutral-700 hover:text-primary">
              <Heart className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="w-full flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="w-full flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" className="block">
                <Button className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
            
            {/* Mobile menu for md and below */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full py-6">
                  <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="text-2xl font-heading font-bold text-primary">
                      TravelEase<span className="text-secondary">.</span>
                    </Link>
                  </div>
                  
                  <nav className="flex flex-col space-y-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link 
                          href={link.href}
                          className={cn(
                            "font-medium py-2 transition-colors",
                            location === link.href
                              ? "text-primary"
                              : "text-neutral-700 hover:text-primary"
                          )}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  
                  <div className="mt-auto">
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link href="/profile" className="block">
                            <Button variant="outline" className="w-full mb-2">
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Button>
                          </Link>
                        </SheetClose>
                        <Button 
                          variant="default" 
                          className="w-full"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/auth" className="block">
                          <Button className="w-full">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Chat Widget for Web (Desktop) - Fixed on the bottom right */}
      <div className="hidden md:block">
        <ChatWidget 
          autoOpen={autoOpenChat}
          initialConversationId={currentConversationId}
        />
      </div>
      
      <footer className="bg-neutral-100 text-neutral-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-heading font-semibold mb-4 text-neutral-800">
                TravelEase<span className="text-secondary">.</span>
              </h3>
              <p className="text-neutral-600 mb-4">
                Your trusted partner for international travel experiences. We make your travel dreams a reality.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-neutral-700 hover:text-secondary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="text-neutral-700 hover:text-secondary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="text-neutral-700 hover:text-secondary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-heading font-semibold mb-4 text-neutral-800">Destinations</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Dubai</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Bali</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Paris</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Tokyo</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Rome</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Maldives</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-heading font-semibold mb-4 text-neutral-800">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Travel Packages</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Hotel Bookings</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Cab Services</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Cruise Bookings</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Event Tickets</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-secondary transition-colors">Travel Insurance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-heading font-semibold mb-4 text-neutral-800">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span className="text-neutral-600">123 Travel Street, Suite 400<br/>New York, NY 10010</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span className="text-neutral-600">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span className="text-neutral-600">info@travelease.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-300 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-600 text-sm mb-4 md:mb-0">&copy; 2023 TravelEase. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-600 text-sm hover:text-secondary transition-colors">Privacy Policy</a>
              <a href="#" className="text-neutral-600 text-sm hover:text-secondary transition-colors">Terms of Service</a>
              <a href="#" className="text-neutral-600 text-sm hover:text-secondary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DesktopLayout;
