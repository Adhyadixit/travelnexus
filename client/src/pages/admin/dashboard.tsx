import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

import AdminSidebar from '@/components/admin/sidebar';
import AnalyticsDashboard from '@/components/admin/analytics-dashboard';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Redirect if not an admin
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user?.isAdmin) {
    setLocation('/auth');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - TravelEase</title>
        <meta name="description" content="Admin dashboard for TravelEase. Manage bookings, listings, and view analytics." />
      </Helmet>

      <div className="flex min-h-screen bg-neutral-50">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            
            <AnalyticsDashboard />
          </div>
        </div>
      </div>
    </>
  );
}
