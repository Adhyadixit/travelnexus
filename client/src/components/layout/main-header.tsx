import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Heart, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";

export default function MainHeader() {
  const { user, logoutMutation } = useAuth();
  
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Destinations", path: "/destinations" },
    { name: "Hotels", path: "/hotels" },
    { name: "Packages", path: "/packages" },
    { name: "Cruises", path: "/cruises" },
    { name: "Cabs", path: "/cabs" },
  ];

  return (
    <header className="hidden md:block bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <a className="text-2xl font-heading font-bold text-primary">
              Travel Ease by Expedia<span className="text-secondary">.</span>
            </a>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path}>
              <a className="font-medium text-neutral-700 hover:text-primary transition-colors">
                {link.name}
              </a>
            </Link>
          ))}
        </nav>
        
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
                <Button variant="ghost" className="hover:bg-transparent flex items-center gap-2">
                  <AvatarWithStatus 
                    fallback={`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`} 
                    size="sm"
                  />
                  <span className="font-medium">{user.firstName || user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="w-full cursor-pointer">Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/bookings">
                    <a className="w-full cursor-pointer">My Bookings</a>
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">
                      <a className="w-full cursor-pointer">Admin Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-500 focus:text-red-500">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button className="bg-primary text-white hover:bg-primary-dark flex items-center">
                <span className="mr-2">Sign In</span>
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
