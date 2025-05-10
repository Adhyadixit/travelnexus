import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const destinations = [
    { name: "Dubai", path: "/destinations" },
    { name: "Bali", path: "/destinations" },
    { name: "Paris", path: "/destinations" },
    { name: "Tokyo", path: "/destinations" },
    { name: "Rome", path: "/destinations" },
    { name: "Maldives", path: "/destinations" },
  ];
  
  const services = [
    { name: "Travel Packages", path: "/packages" },
    { name: "Hotel Bookings", path: "/hotels" },
    { name: "Cab Services", path: "/cabs" },
    { name: "Cruise Bookings", path: "/cruises" },
    { name: "Event Tickets", path: "/" },
    { name: "Travel Insurance", path: "/" },
  ];

  return (
    <footer className={`bg-neutral-800 text-white py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-heading font-semibold mb-4">
              Travel Ease by Expedia<span className="text-secondary">.</span>
            </h3>
            <p className="text-neutral-300 mb-4">
              Your trusted partner for international travel experiences. We make your travel dreams a reality.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-secondary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Destinations</h4>
            <ul className="space-y-2">
              {destinations.map((destination) => (
                <li key={destination.name}>
                  <Link href={destination.path}>
                    <a className="text-neutral-300 hover:text-white transition-colors">
                      {destination.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <Link href={service.path}>
                    <a className="text-neutral-300 hover:text-white transition-colors">
                      {service.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="mr-2 text-secondary shrink-0 mt-1" size={18} />
                <span className="text-neutral-300">
                  123 Travel Street, Suite 400<br />New York, NY 10010
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 text-secondary shrink-0" size={18} />
                <span className="text-neutral-300">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 text-secondary shrink-0" size={18} />
                <span className="text-neutral-300">info@travelease.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Travel Ease by Expedia. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-neutral-400 text-sm hover:text-white transition-colors">
              <a>Privacy Policy</a>
            </Link>
            <Link href="/terms-of-service" className="text-neutral-400 text-sm hover:text-white transition-colors">
              <a>Terms of Service</a>
            </Link>
            <Link href="/cookie-policy" className="text-neutral-400 text-sm hover:text-white transition-colors">
              <a>Cookie Policy</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
