import { Link } from "wouter";
import { Home, Globe, Briefcase, User, Package } from "lucide-react";
import useMobileMenu from "@/lib/use-mobile-menu";

export default function MobileNavigation() {
  const { activeTab, setActiveTab } = useMobileMenu();
  
  const navItems = [
    { name: "home", label: "Home", icon: Home, path: "/" },
    { name: "explore", label: "Explore", icon: Globe, path: "/destinations" },
    { name: "packages", label: "Packages", icon: Package, path: "/packages" },
    { name: "bookings", label: "Bookings", icon: Briefcase, path: "/bookings" },
    { name: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-between items-center z-30 py-2 px-4">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          onClick={() => setActiveTab(item.name)}
        >
          <a className={`flex flex-col items-center ${activeTab === item.name ? 'text-primary' : 'text-neutral-500'}`}>
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
}
