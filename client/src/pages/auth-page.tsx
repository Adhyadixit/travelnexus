import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export default function AuthPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [activeTab, setActiveTab] = useState<string>("login");
  
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  
  // If user is already logged in, redirect to home or the page they were trying to access
  useEffect(() => {
    if (user) {
      const redirectTo = new URLSearchParams(window.location.search).get("redirect");
      setLocation(redirectTo || "/");
    }
  }, [user, setLocation]);
  
  return (
    <Layout>
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
        {/* Auth Form Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
                Welcome to TravelEase<span className="text-secondary">.</span>
              </h1>
              <p className="text-neutral-600 mt-2">
                Sign in to your account or create a new one
              </p>
            </div>
            
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSuccess={() => setLocation("/")} />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm onSuccess={() => setLocation("/")} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Hero Image Section */}
        <div 
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1200')` 
          }}
        >
          <div className="h-full flex flex-col justify-center px-8 text-white">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Discover the World with Us
            </h2>
            <p className="text-lg mb-6">
              Join TravelEase and gain access to exclusive travel deals, personalized recommendations, and seamless booking experiences.
            </p>
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p>Book international travel packages</p>
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p>Find luxury accommodations worldwide</p>
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p>Experience exclusive events and cruises</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
