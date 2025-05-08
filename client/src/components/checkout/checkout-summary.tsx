import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface CheckoutSummaryProps {
  item: {
    id: number;
    name: string;
    price: number;
    image: string;
    type: "package" | "hotel" | "cab" | "cruise" | "event";
    destination?: string;
    duration?: number;
    rating?: number;
  };
  bookingDetails: {
    startDate: Date;
    endDate?: Date;
    numberOfPeople: number;
  };
}

export default function CheckoutSummary({ item, bookingDetails }: CheckoutSummaryProps) {
  const { startDate, endDate, numberOfPeople } = bookingDetails;
  const needsEndDate = item.type === 'hotel' || item.type === 'cab';
  
  // Calculate duration and total price
  let duration = 0;
  if (needsEndDate && endDate) {
    duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  } else if (item.duration) {
    duration = item.duration;
  }
  
  // Calculate total price
  let totalPrice = item.price;
  if (needsEndDate && duration > 0) {
    totalPrice = item.price * duration;
  }
  if (item.type === 'package' || item.type === 'cruise' || item.type === 'event') {
    totalPrice = item.price * numberOfPeople;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-20 h-20 object-cover rounded-md"
          />
          <div>
            <h3 className="font-medium">{item.name}</h3>
            {item.destination && (
              <p className="text-sm text-muted-foreground">{item.destination}</p>
            )}
            {item.rating && (
              <div className="flex items-center text-sm">
                <span className="text-secondary">★</span>
                <span className="ml-1">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2 border-t border-b py-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dates</span>
            <span>
              {format(startDate, "MMM d, yyyy")}
              {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span>
              {needsEndDate 
                ? `${duration} ${duration === 1 ? 'day' : 'days'}`
                : item.duration 
                  ? `${item.duration} ${item.duration === 1 ? 'day' : 'days'}`
                  : 'N/A'
              }
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Travelers</span>
            <span>{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base price</span>
            <span>${item.price.toLocaleString()}</span>
          </div>
          
          {needsEndDate && duration > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">× {duration} days</span>
              <span>${(item.price * duration).toLocaleString()}</span>
            </div>
          )}
          
          {(item.type === 'package' || item.type === 'cruise' || item.type === 'event') && numberOfPeople > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">× {numberOfPeople} people</span>
              <span>${(item.price * numberOfPeople).toLocaleString()}</span>
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">${totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
