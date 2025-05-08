import { Link } from "wouter";
import { Booking, bookingTypeEnum } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
  packageName?: string;
  hotelName?: string;
  driverName?: string;
  cruiseName?: string;
  eventName?: string;
  imageUrl?: string;
  className?: string;
}

export function BookingCard({ 
  booking, 
  packageName,
  hotelName,
  driverName,
  cruiseName,
  eventName,
  imageUrl,
  className 
}: BookingCardProps) {
  // Get the appropriate name based on booking type
  const getItemName = () => {
    switch (booking.bookingType) {
      case 'package':
        return packageName || 'Travel Package';
      case 'hotel':
        return hotelName || 'Hotel Stay';
      case 'driver':
        return driverName || 'Private Driver';
      case 'cruise':
        return cruiseName || 'Cruise';
      case 'event':
        return eventName || 'Event';
      default:
        return 'Booking';
    }
  };

  // Get the appropriate status badge color
  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-col md:flex-row">
        {imageUrl && (
          <div className="w-full md:w-1/4 h-32 md:h-auto">
            <img 
              src={imageUrl} 
              alt={getItemName()} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardContent className={cn(
          "flex-1 p-4",
          !imageUrl && "w-full"
        )}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="capitalize">{booking.bookingType}</Badge>
                <Badge className={getStatusColor()}>{booking.status}</Badge>
              </div>
              
              <h3 className="font-heading font-semibold text-lg">{getItemName()}</h3>
              
              <div className="flex flex-col md:flex-row gap-4 mt-2 text-sm text-neutral-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}</span>
                </div>
              </div>
            </div>
            
            <div className="md:text-right mt-4 md:mt-0">
              <div className="font-heading font-bold text-lg">{formatCurrency(booking.totalPrice)}</div>
              <div className="text-sm text-neutral-500 mb-3">
                {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
              </div>
              
              <Link href={`/bookings/${booking.id}`}>
                <Button size="sm" className="w-full md:w-auto" variant="outline">
                  View Details
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
