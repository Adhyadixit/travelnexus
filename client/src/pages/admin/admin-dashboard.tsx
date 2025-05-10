import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AnalyticsSection from "@/components/admin/analytics-section";
import { Helmet } from 'react-helmet';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      setLocation("/admin-auth");
    } else if (user.role !== 'admin') {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | Travel Ease by Expedia</title>
        <meta name="description" content="Travel Ease by Expedia administrative dashboard for managing travel bookings, packages, and analytics." />
        <meta property="og:title" content="Admin Dashboard | Travel Ease by Expedia" />
        <meta property="og:description" content="Comprehensive administration panel for Travel Ease by Expedia travel platform." />
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <AnalyticsSection />
      </div>
    </div>
  );
}
