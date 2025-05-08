import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Booking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, LockIcon, CreditCard } from "lucide-react";

// Payment form schema
const paymentFormSchema = z.object({
  cardholderName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  savePaymentMethod: z.boolean().default(false),
  billingAddressSameAsProfile: z.boolean().default(true),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  bookingId: number;
  totalAmount: number;
  itemName: string;
  onSuccess?: (booking: Booking) => void;
}

export function PaymentForm({ bookingId, totalAmount, itemName, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const [showBillingAddress, setShowBillingAddress] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      savePaymentMethod: false,
      billingAddressSameAsProfile: true,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/payment`);
      return await res.json();
    },
    onSuccess: (data: Booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Payment Successful",
        description: `Your booking for ${itemName} has been confirmed.`,
      });
      if (onSuccess) onSuccess(data);
      else navigate("/bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    // In a real application, this would validate the credit card and then call the payment API
    // Here we just process the payment directly
    processPaymentMutation.mutate();
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    form.setValue("expiryDate", value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Complete your booking by providing your payment information.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 bg-neutral-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Total Amount</h3>
                  <p className="text-sm text-neutral-500">For {itemName}</p>
                </div>
                <div className="text-xl font-bold font-heading">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
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
                    <Input 
                      placeholder="1234 5678 9012 3456" 
                      maxLength={16}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="MM/YY" 
                        maxLength={5}
                        {...field}
                        onChange={handleExpiryDateChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="123" 
                        maxLength={4}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="savePaymentMethod"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Save this card for future payments</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />
            
            <FormField
              control={form.control}
              name="billingAddressSameAsProfile"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setShowBillingAddress(!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Billing address same as profile</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {showBillingAddress && (
              <div className="space-y-4 pt-4">
                <h3 className="font-medium">Billing Address</h3>
                
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
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center mt-4 p-2 bg-neutral-50 rounded-md text-sm text-neutral-600">
              <LockIcon className="h-4 w-4 mr-2 text-green-500" />
              Your payment information is secure and encrypted
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={processPaymentMutation.isPending}
            >
              {processPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(totalAmount)}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
