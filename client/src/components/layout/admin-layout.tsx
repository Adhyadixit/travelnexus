import { ReactNode } from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/admin-auth" />;
  }
  
  if (user.role !== "admin") {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block w-64">
        <AdminSidebar />
      </div>
      <div className="flex-1 overflow-auto bg-neutral-50">
        {children}
      </div>
    </div>
  );
}