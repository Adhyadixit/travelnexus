import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AnalyticsSection from "@/components/admin/analytics-section";
import { Helmet } from 'react-helmet';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/admin-auth");
    } else if (!user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);
  
  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | TravelEase</title>
        <meta name="description" content="TravelEase administrative dashboard for managing travel bookings, packages, and analytics." />
        <meta property="og:title" content="Admin Dashboard | TravelEase" />
        <meta property="og:description" content="Comprehensive administration panel for TravelEase travel platform." />
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <AnalyticsSection />
      </div>
    </div>
  );
}
