import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Booking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentFormProps {
  bookingId: number;
  totalAmount: number;
  itemName: string;
  onSuccess?: (booking: Booking) => void;
}

export function PaymentForm({ bookingId, totalAmount, itemName, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPaymentError, setShowPaymentError] = useState(false);

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      // Intentionally throwing an error for the payment system
      throw new Error("We are facing some issues with our payment system. Please try again later.");
    },
    onError: (error: Error) => {
      setShowPaymentError(true);
      toast({
        title: "Payment System Unavailable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayNow = () => {
    processPaymentMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Details
          </CardTitle>
          <CardDescription>
            Complete your booking by paying for your reservation.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
          
          {showPaymentError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment System Unavailable</AlertTitle>
              <AlertDescription>
                We are facing some issues with our payment system. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md border p-4 bg-blue-50 text-blue-700">
            <p className="text-sm">
              By clicking the Pay Now button, you agree to our Terms of Service and Privacy Policy.
              Your booking will be confirmed upon successful payment processing.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handlePayNow}
            size="lg"
            disabled={processPaymentMutation.isPending}
          >
            {processPaymentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay Now ${formatCurrency(totalAmount)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
