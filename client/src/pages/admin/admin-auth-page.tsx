import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, LoginData } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";
import { Helmet } from 'react-helmet';

// Login Form Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminAuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Redirect if already logged in and is admin
  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        setLocation("/admin/dashboard");
      } else {
        setErrorMessage("You don't have admin permissions.");
      }
    }
  }, [user, setLocation]);
  
  // Login Form
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Handle login form submission
  function onSubmit(data: LoginData) {
    setErrorMessage(null);
    loginMutation.mutate(data, {
      onError: (error) => {
        setErrorMessage(error.message || "Login failed. Please check your credentials.");
      },
      onSuccess: (user) => {
        if (!user.isAdmin) {
          setErrorMessage("You don't have admin permissions.");
        }
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <Helmet>
        <title>Admin Login | TravelEase</title>
        <meta name="description" content="Administrator login page for TravelEase travel management system." />
        <meta property="og:title" content="Admin Login | TravelEase" />
        <meta property="og:description" content="Secure login for TravelEase administrators." />
      </Helmet>
      
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold text-primary">
              TravelEase<span className="text-secondary">.</span>
            </h1>
          </div>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {errorMessage}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" className="text-sm text-muted-foreground" onClick={() => setLocation("/")}>
            Return to main site
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
