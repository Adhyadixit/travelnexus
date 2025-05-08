import { ReactNode, useEffect } from "react";
import MobileNavigation from "./mobile-navigation";
import MainHeader from "./main-header";
import Footer from "./footer";
import { useLocation } from "wouter";
import useMobileMenu from "@/lib/use-mobile-menu";

interface PageContainerProps {
  children: ReactNode;
  withoutNavigation?: boolean;
  hideFooterOnMobile?: boolean;
  className?: string;
}

export default function PageContainer({
  children,
  withoutNavigation = false,
  hideFooterOnMobile = false,
  className = "",
}: PageContainerProps) {
  const [location] = useLocation();
  const { setActiveTab } = useMobileMenu();
  
  useEffect(() => {
    // Set active tab based on current location
    if (location === "/") {
      setActiveTab("home");
    } else if (location.includes("/packages")) {
      setActiveTab("packages");
    } else if (location.includes("/profile")) {
      setActiveTab("profile");
    } else if (location.includes("/bookings")) {
      setActiveTab("bookings");
    } else if (location.includes("/destinations") || location.includes("/hotels") || location.includes("/cruises") || location.includes("/cabs")) {
      setActiveTab("explore");
    }
  }, [location, setActiveTab]);

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
      
      <Footer className={hideFooterOnMobile ? "hidden md:block" : ""} />
      
      {!withoutNavigation && <MobileNavigation />}
    </div>
  );
}
