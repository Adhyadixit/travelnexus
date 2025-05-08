import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  CreditCard, 
  LogOut, 
  Save, 
  Mail, 
  Phone, 
  Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// Define the schema for the profile update form
const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Define the schema for the password update form
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Profile update form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || '',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
    },
  });
  
  // Password update form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/profile`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    },
  });
  
  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      const res = await apiRequest("POST", `/api/user/change-password`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message,
      });
    },
  });
  
  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };
  
  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    const { currentPassword, newPassword } = data;
    passwordMutation.mutate({ currentPassword, newPassword });
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get initials for avatar
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading profile...</h2>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - TravelEase</title>
        <meta name="description" content="Manage your TravelEase account settings, personal information, and preferences. Update your profile and security settings." />
        <meta property="og:title" content="My Profile - TravelEase" />
        <meta property="og:description" content="Manage your TravelEase account settings, personal information, and preferences." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          <section className="py-8 md:py-12 bg-neutral-50">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-start max-w-6xl mx-auto">
                {/* Sidebar */}
                <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
                  <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-20">
                    <div className="flex flex-col items-center mb-6">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarFallback className="bg-primary text-white text-xl">
                          {getInitials(user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold">{user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}</h2>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                      
                      {user.role === 'admin' && (
                        <CustomTag className="mt-2 bg-accent text-white">Admin</CustomTag>
                      )}
                    </div>
                    
                    <nav>
                      <ul className="space-y-1">
                        <li>
                          <TabButton 
                            icon={<User className="h-4 w-4 mr-2" />} 
                            label="Account" 
                            value="account" 
                            activeTab={activeTab}
                            onClick={() => setActiveTab('account')}
                          />
                        </li>
                        <li>
                          <TabButton 
                            icon={<Shield className="h-4 w-4 mr-2" />} 
                            label="Security" 
                            value="security" 
                            activeTab={activeTab}
                            onClick={() => setActiveTab('security')}
                          />
                        </li>
                        <li>
                          <TabButton 
                            icon={<Bell className="h-4 w-4 mr-2" />} 
                            label="Notifications" 
                            value="notifications" 
                            activeTab={activeTab}
                            onClick={() => setActiveTab('notifications')}
                          />
                        </li>
                        <li>
                          <TabButton 
                            icon={<CreditCard className="h-4 w-4 mr-2" />} 
                            label="Payment Methods" 
                            value="payment" 
                            activeTab={activeTab}
                            onClick={() => setActiveTab('payment')}
                          />
                        </li>
                        <li>
                          <TabButton 
                            icon={<Settings className="h-4 w-4 mr-2" />} 
                            label="Preferences" 
                            value="preferences" 
                            activeTab={activeTab}
                            onClick={() => setActiveTab('preferences')}
                          />
                        </li>
                      </ul>
                      
                      <Separator className="my-4" />
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </Button>
                      
                      {user.isAdmin && (
                        <Button 
                          asChild
                          variant="default" 
                          className="w-full justify-start mt-2"
                        >
                          <a href="/admin/dashboard">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </a>
                        </Button>
                      )}
                    </nav>
                  </div>
                </div>
                
                {/* Main content */}
                <div className="flex-1">
                  <Card>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Profile Settings</CardTitle>
                            <CardDescription>
                              Manage your account settings and preferences
                            </CardDescription>
                          </div>
                          <TabsList>
                            <TabsTrigger value="account">Account</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="payment">Payment</TabsTrigger>
                            <TabsTrigger value="preferences">Preferences</TabsTrigger>
                          </TabsList>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <TabsContent value="account">
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      This is your public display name.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="email" />
                                    </FormControl>
                                    <FormDescription>
                                      We'll use this email to send you booking confirmations and updates.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="tel" />
                                    </FormControl>
                                    <FormDescription>
                                      Optional. For booking-related communications and updates.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-end">
                                <Button 
                                  type="submit" 
                                  disabled={profileMutation.isPending || !profileForm.formState.isDirty}
                                >
                                  {profileMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="mr-2 h-4 w-4" />
                                      Save Changes
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </TabsContent>
                        
                        <TabsContent value="security">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium">Change Password</h3>
                              <p className="text-sm text-neutral-500 mt-1">
                                Update your password to keep your account secure
                              </p>
                            </div>
                            
                            <Form {...passwordForm}>
                              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                  control={passwordForm.control}
                                  name="currentPassword"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Current Password</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="password" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={passwordForm.control}
                                  name="newPassword"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>New Password</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="password" />
                                      </FormControl>
                                      <FormDescription>
                                        Password must be at least 6 characters.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={passwordForm.control}
                                  name="confirmPassword"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Confirm New Password</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="password" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-end">
                                  <Button 
                                    type="submit" 
                                    disabled={passwordMutation.isPending}
                                  >
                                    {passwordMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      "Update Password"
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                            
                            <Separator />
                            
                            <div>
                              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                              <p className="text-sm text-neutral-500 mt-1">
                                Add an extra layer of security to your account
                              </p>
                              
                              <div className="mt-4">
                                <Button variant="outline">
                                  Set up 2FA
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="notifications">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium">Notification Preferences</h3>
                              <p className="text-sm text-neutral-500 mt-1">
                                Control how and when you receive notifications
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              <NotificationPreference
                                title="Email Notifications"
                                description="Receive booking confirmations, updates, and offers"
                                icon={<Mail className="h-4 w-4" />}
                                defaultChecked={true}
                              />
                              
                              <NotificationPreference
                                title="SMS Notifications"
                                description="Get text messages for booking updates and reminders"
                                icon={<Phone className="h-4 w-4" />}
                                defaultChecked={false}
                              />
                              
                              <NotificationPreference
                                title="Marketing Emails"
                                description="Special offers, discounts, and travel inspiration"
                                icon={<Mail className="h-4 w-4" />}
                                defaultChecked={true}
                              />
                              
                              <NotificationPreference
                                title="Travel Alerts"
                                description="Important updates about your destinations"
                                icon={<Bell className="h-4 w-4" />}
                                defaultChecked={true}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="payment">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium">Payment Methods</h3>
                              <p className="text-sm text-neutral-500 mt-1">
                                Manage your saved payment methods
                              </p>
                            </div>
                            
                            <div className="bg-neutral-50 border rounded-lg p-6 text-center">
                              <CreditCard className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                              <h3 className="text-lg font-medium">No payment methods yet</h3>
                              <p className="text-sm text-neutral-500 mt-1 mb-4">
                                You haven't added any payment methods to your account
                              </p>
                              <Button>
                                Add Payment Method
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="preferences">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium">Travel Preferences</h3>
                              <p className="text-sm text-neutral-500 mt-1">
                                Customize your travel experience
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              <PreferenceOption
                                title="Currency"
                                description="Choose your preferred currency for prices"
                                value="USD"
                              />
                              
                              <PreferenceOption
                                title="Language"
                                description="Select your preferred language"
                                value="English"
                              />
                              
                              <Separator />
                              
                              <h3 className="text-medium font-medium">Travel Interests</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <InterestTag label="Beach" />
                                <InterestTag label="City" />
                                <InterestTag label="Culture" />
                                <InterestTag label="Food" />
                                <InterestTag label="Adventure" selected />
                                <InterestTag label="Relaxation" selected />
                                <InterestTag label="History" />
                                <InterestTag label="Nature" selected />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </CardContent>
                    </Tabs>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
        <MobileNav />
      </div>
    </>
  );
}

// Helper components
type TabButtonProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  activeTab: string;
  onClick: () => void;
};

function TabButton({ icon, label, value, activeTab, onClick }: TabButtonProps) {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`flex items-center w-full p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-neutral-600 hover:bg-neutral-100'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

type NotificationPreferenceProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultChecked: boolean;
};

function NotificationPreference({ title, description, icon, defaultChecked }: NotificationPreferenceProps) {
  const [enabled, setEnabled] = useState(defaultChecked);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 bg-neutral-100 rounded-md">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} />
    </div>
  );
}

type PreferenceOptionProps = {
  title: string;
  description: string;
  value: string;
};

function PreferenceOption({ title, description, value }: PreferenceOptionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        <Button variant="outline" size="sm">Change</Button>
      </div>
    </div>
  );
}

type InterestTagProps = {
  label: string;
  selected?: boolean;
};

function InterestTag({ label, selected = false }: InterestTagProps) {
  return (
    <button
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        selected
          ? 'bg-primary text-white'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}

function CustomTag({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {children}
    </span>
  );
}
