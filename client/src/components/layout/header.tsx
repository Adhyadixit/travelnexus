import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Search, Heart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="hidden md:block bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-xl">
              TE
            </div>
            <span className="text-2xl font-bold text-primary">
              Travel Ease by Expedia<span className="text-secondary">.</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`font-medium ${location === '/' ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Home
          </Link>
          <Link href="/destinations" className={`font-medium ${location.startsWith('/destinations') ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Destinations
          </Link>
          <Link href="/hotels" className={`font-medium ${location.startsWith('/hotels') ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Hotels
          </Link>
          <Link href="/packages" className={`font-medium ${location.startsWith('/packages') ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Packages
          </Link>
          <Link href="/cruises" className={`font-medium ${location.startsWith('/cruises') ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Cruises
          </Link>
          <Link href="/cabs" className={`font-medium ${location.startsWith('/cabs') ? 'text-primary' : 'text-neutral-700 hover:text-primary'} transition-colors`}>
            Cabs
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button className="text-neutral-700 hover:text-primary">
            <Search size={20} />
          </button>
          <button className="text-neutral-700 hover:text-primary">
            <Heart size={20} />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="font-medium">{user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}</p>
                  <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/bookings" className="cursor-pointer">My Bookings</Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="cursor-pointer">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="flex items-center px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">
              <Link href="/auth">
                <span className="mr-2">Sign In</span>
                <User size={16} />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-xl">
              TE
            </div>
            <span className="text-2xl font-bold text-primary">
              Travel Ease by Expedia<span className="text-secondary">.</span>
            </span>
          </Link>
          <button onClick={toggleMobileMenu} className="p-2">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Home
              </Link>
            </li>
            <li>
              <Link href="/destinations" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Destinations
              </Link>
            </li>
            <li>
              <Link href="/hotels" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Hotels
              </Link>
            </li>
            <li>
              <Link href="/packages" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Packages
              </Link>
            </li>
            <li>
              <Link href="/cruises" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Cruises
              </Link>
            </li>
            <li>
              <Link href="/cabs" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                Cabs
              </Link>
            </li>
          </ul>
          {user ? (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center mb-4">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}</p>
                  <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
              </div>
              <ul className="space-y-2">
                <li>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                    My Bookings
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-neutral-800">
                      Admin Dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }} 
                    className="block w-full text-left py-2 font-medium text-red-500"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t">
              <Button asChild className="w-full">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}