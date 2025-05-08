import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Booking, insertBookingSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, CreditCard, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { InquiryForm } from "@/components/inquiry-form";
import { apiRequest } from "@/lib/queryClient";

// Extend the booking schema for checkout form
const checkoutFormSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
  numberOfPeople: z.number().min(1, "At least 1 person is required"),
  // Address information
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  // Payment information
  cardName: z.string().min(1, "Card holder name is required"),
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(16),
  cardExpiry: z.string().min(5, "Expiry date is required in MM/YY format"),
  cardCVC: z.string().min(3, "CVC must be 3 digits").max(3),
}).refine((data) => {
  if (data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface BookingItem {
  id: number;
  name: string;
  price: number;
  image: string;
  type: "package" | "hotel" | "driver" | "cruise" | "event";
  duration?: number;
}

interface CheckoutFormProps {
  item: BookingItem;
  onSubmit: (booking: Partial<Booking>) => Promise<any>; // Changed to allow returning the booking
  isSubmitting: boolean;
}

export default function CheckoutForm({ item, onSubmit, isSubmitting }: CheckoutFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const needsEndDate = item.type === 'hotel' || item.type === 'driver';
  
  let endDate: Date | undefined;
  if (item.duration) {
    const date = new Date();
    date.setDate(date.getDate() + item.duration);
    endDate = date;
  }

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: endDate,
      numberOfPeople: 1,
      // Address information
      address: "",
      city: "",
      state: "",
      zipCode: "",
      // Payment information
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVC: "",
    },
  });

  // Reference to show the payment error modal
  const [showPaymentError, setShowPaymentError] = useState(false);
  
  const handlePayment = async (values: CheckoutFormValues) => {
    const { cardName, cardNumber, cardExpiry, cardCVC, address, city, state, zipCode, ...bookingData } = values;
    
    // Calculate total price based on days if hotel or driver
    let totalPrice = item.price;
    if (needsEndDate && values.endDate) {
      const days = Math.ceil((values.endDate.getTime() - values.startDate.getTime()) / (1000 * 60 * 60 * 24));
      totalPrice = item.price * days;
    }
    
    // If it's a package or cruise, multiply by number of people
    if (item.type === 'package' || item.type === 'cruise' || item.type === 'event') {
      totalPrice = totalPrice * values.numberOfPeople;
    }
    
    try {
      // Create the booking object with address information
      const booking: Partial<Booking> = {
        ...bookingData,
        bookingType: item.type,
        itemId: item.id,
        totalPrice,
        status: "pending",
        paymentStatus: "pending",
        // Include address information
        address,
        city, 
        state,
        zipCode,
        country: "USA" // Default country
      };
      
      // Save the booking first
      const savedBooking = await onSubmit(booking);
      
      if (!savedBooking || !savedBooking.id) {
        // If there's an issue with booking creation
        throw new Error("Failed to create booking");
      }
      
      // Now process the payment with our payment API
      try {
        // Prepare payment data with booking ID
        const paymentData = {
          bookingId: savedBooking.id,
          cardName,
          cardNumber, 
          cardExpiry,
          cardCVC,
          address,
          city,
          state,
          zipCode,
          country: "USA",
          amount: totalPrice
        };
        
        // Call our payment processing API
        const paymentResponse = await apiRequest(
          "POST", 
          `/api/payment-details/process/${savedBooking.id}`, 
          paymentData
        );
        
        // Parse the response
        const paymentResult = await paymentResponse.json();
        
        // Since we know Stripe is unavailable, we'll show the payment error screen
        setShowPaymentError(true);
        
      } catch (error) {
        console.error("Payment processing error:", error);
        // Still show the payment error screen since that's our expected behavior
        setShowPaymentError(true);
      }
      
    } catch (error) {
      console.error("Booking failed:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to complete your booking.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </CardFooter>
      </Card>
    );
  }

  // If payment error is shown, display the error message
  if (showPaymentError) {
    return (
      <Card className="py-8">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">Payment Processing Error</CardTitle>
            <CardDescription className="text-base">
              We are experiencing issues with our payment system. Your booking information has been saved, but we could not process your payment at this time.
            </CardDescription>
          </div>
          <div className="space-y-4 w-full max-w-md">
            <InquiryForm 
              productName={item.name}
              defaultSubject={`Payment issue with ${item.name}`}
              triggerButtonText="Inquire About Payment Options"
              triggerButtonFullWidth={true}
            />
            <Button variant="outline" className="w-full" onClick={() => navigate("/bookings")}>
              View My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-neutral-800 font-medium' : 'bg-muted text-muted-foreground'}`}>
          1
        </div>
        <div className="h-1 w-12 bg-muted flex-grow"></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-neutral-800 font-medium' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Booking Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 text-neutral-800" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                            className="text-neutral-800"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {needsEndDate && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 text-neutral-800" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date <= form.getValues().startDate
                              }
                              initialFocus
                              className="text-neutral-800"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={form.control}
                name="numberOfPeople"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Travelers</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of travelers" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="text-neutral-800">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem key={num} value={num.toString()} className="text-neutral-800">
                            {num} {num === 1 ? 'Person' : 'People'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <h3 className="text-lg font-medium mt-8">Contact Information</h3>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4">
                <Button type="button" onClick={() => setStep(2)}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Payment Information</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>${item.price.toLocaleString()}</span>
                  </div>
                  {needsEndDate && form.getValues().endDate && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {Math.ceil((form.getValues().endDate!.getTime() - form.getValues().startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                      <span>
                        x ${item.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {(item.type === 'package' || item.type === 'cruise' || item.type === 'event') && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {form.getValues().numberOfPeople} {form.getValues().numberOfPeople === 1 ? 'Person' : 'People'}
                      </span>
                      <span>
                        x ${item.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        ${needsEndDate && form.getValues().endDate
                          ? (item.price * Math.ceil((form.getValues().endDate!.getTime() - form.getValues().startDate.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()
                          : (item.type === 'package' || item.type === 'cruise' || item.type === 'event')
                            ? (item.price * form.getValues().numberOfPeople).toLocaleString()
                            : item.price.toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name on Card</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="1234 5678 9012 3456"
                            maxLength={16}
                            {...field}
                          />
                          <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cardCVC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl>
                          <Input placeholder="123" maxLength={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
