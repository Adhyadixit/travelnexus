import { Home, Compass, Bookmark, User, Luggage } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-between items-center z-30 py-2 px-4">
      <NavItem 
        href="/" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={location === '/'} 
      />
      <NavItem 
        href="/destinations" 
        icon={<Compass size={20} />} 
        label="Explore" 
        isActive={location.startsWith('/destinations')} 
      />
      <NavItem 
        href="/packages" 
        icon={<Luggage size={20} />} 
        label="Packages" 
        isActive={location.startsWith('/packages')} 
      />
      <NavItem 
        href="/bookings" 
        icon={<Bookmark size={20} />} 
        label="Bookings" 
        isActive={location.startsWith('/bookings')} 
      />
      <NavItem 
        href="/profile" 
        icon={<User size={20} />} 
        label="Profile" 
        isActive={location.startsWith('/profile')} 
      />
    </nav>
  );
}

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
};

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex flex-col items-center transition-colors",
        isActive ? "text-primary" : "text-neutral-500 hover:text-primary"
      )}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
