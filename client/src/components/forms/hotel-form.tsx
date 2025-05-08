import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { insertHotelSchema, Hotel, Destination } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Extend the insert schema for form validation
const hotelFormSchema = insertHotelSchema.extend({
  amenities: z.string().optional(),
});

type HotelFormValues = z.infer<typeof hotelFormSchema>;

// Function to convert amenities string to JSON and back
const stringToAmenitiesArray = (amenities: string): string[] => {
  try {
    return amenities.split('\n').filter(line => line.trim() !== '');
  } catch (e) {
    return [];
  }
};

const amenitiesArrayToString = (amenities: string[] | null): string => {
  if (!amenities) return '';
  return amenities.join('\n');
};

interface HotelFormProps {
  initialData?: Hotel;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function HotelForm({ initialData, onSubmit, isSubmitting }: HotelFormProps) {
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  // Parse initial data for form
  const defaultValues: Partial<HotelFormValues> = {
    name: initialData?.name || "",
    destinationId: initialData?.destinationId.toString() || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    rating: initialData?.rating || 5,
    pricePerNight: initialData?.pricePerNight || 0,
    address: initialData?.address || "",
    amenities: initialData?.amenities ? amenitiesArrayToString(initialData.amenities as string[]) : "",
  };

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: HotelFormValues) => {
    // Convert amenities string to JSON array
    const formattedData = {
      ...data,
      destinationId: parseInt(data.destinationId),
      amenities: data.amenities ? stringToAmenitiesArray(data.amenities) : [],
    };
    
    onSubmit(formattedData);
  };

  if (destinationsLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotel Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter hotel name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="destinationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {destinations?.map((destination) => (
                    <SelectItem key={destination.id} value={destination.id.toString()}>
                      {destination.name}, {destination.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Star Rating (1-5)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="5" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pricePerNight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Per Night ($)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the hotel..." 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the hotel address" 
                  className="min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amenities (One per line)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Free Wi-Fi&#10;Swimming Pool&#10;Fitness Center&#10;24/7 Room Service" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : initialData ? "Update Hotel" : "Create Hotel"}
        </Button>
      </form>
    </Form>
  );
}
