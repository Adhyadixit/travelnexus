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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, X, AlertCircle } from "lucide-react";
import RoomImagesManager from "@/components/rooms/room-images-manager";

// Extend the insert schema for form validation
const hotelFormSchema = insertHotelSchema.extend({
  // Convert some of the JSON string fields to more usable form types
  destinationId: z.string(), // Store ID as string in form for select component
  imageGalleryUrls: z.array(z.string()).optional(),
  amenitiesList: z.string().optional(),
  languagesList: z.string().optional(),
  attractionsList: z.string().optional(),
  policiesList: z.string().optional(),
  roomTypesList: z.string().optional(),
  hotelType: z.enum(['hotel', 'resort', 'villa', 'independent_house']).default('hotel'),
});

type HotelFormValues = z.infer<typeof hotelFormSchema>;

// Helper functions for converting between form and DB formats
const stringToArray = (str: string): string[] => {
  try {
    return str.split('\n').filter(line => line.trim() !== '');
  } catch (e) {
    return [];
  }
};

const arrayToString = (arr: string[] | null): string => {
  if (!arr) return '';
  return arr.join('\n');
};

const parseJsonOrDefault = (jsonString: string | null, defaultValue: any): any => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
};

const stringifyJsonSafely = (value: any): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return '';
  }
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
    destinationId: initialData?.destinationId ? initialData.destinationId.toString() : "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    imageUrl: initialData?.imageUrl || "",
    imageGalleryUrls: parseJsonOrDefault(initialData?.imageGallery || null, []),
    rating: initialData?.rating || 5,
    price: initialData?.price || 0,
    userRating: initialData?.userRating || 0,
    checkIn: initialData?.checkIn || "14:00",
    checkOut: initialData?.checkOut || "12:00",
    hotelType: initialData?.hotelType || "hotel",
    amenitiesList: arrayToString(parseJsonOrDefault(initialData?.amenities || null, [])),
    policiesList: stringifyJsonSafely(parseJsonOrDefault(initialData?.policies || null, {
      cancellation: "Free cancellation up to 24 hours before check-in",
      payment: "Pay at property",
      pets: "Pets not allowed"
    })),
    languagesList: arrayToString(parseJsonOrDefault(initialData?.languagesSpoken || null, [])),
    attractionsList: arrayToString(parseJsonOrDefault(initialData?.nearbyAttractions || null, [])),
    featured: initialData?.featured ?? false,
    freeCancellation: initialData?.freeCancellation ?? false,
    roomTypesList: stringifyJsonSafely(parseJsonOrDefault(initialData?.roomTypes || null, [
      { name: "Standard Room", price: 0, maxOccupancy: 2 },
      { name: "Deluxe Room", price: 50, maxOccupancy: 2 },
      { name: "Suite", price: 100, maxOccupancy: 4 }
    ])),
  };

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: HotelFormValues) => {
    try {
      // Format the data for database storage
      console.log("Form data before formatting:", data);
      const formattedData = {
        ...data,
        destinationId: parseInt(data.destinationId),
        // Convert form text fields to proper JSON strings for DB storage
        amenities: stringToArray(data.amenitiesList || ""),
        languagesSpoken: stringToArray(data.languagesList || ""),
        nearbyAttractions: stringToArray(data.attractionsList || ""),
        policies: data.policiesList,
        roomTypes: data.roomTypesList,
        imageGallery: JSON.stringify(data.imageGalleryUrls || []),
      };
      
      // Remove temporary form-only fields before submission
      delete formattedData.amenitiesList;
      delete formattedData.languagesList;
      delete formattedData.attractionsList;
      delete formattedData.policiesList;
      delete formattedData.roomTypesList;
      delete formattedData.imageGalleryUrls;
      
      console.log("Formatted data for submission:", formattedData);
      onSubmit(formattedData);
    } catch (error) {
      console.error("Error in hotel form submission:", error);
    }
  };

  // Handle image gallery inputs
  const imageGallery = form.watch("imageGalleryUrls") || [];
  
  const addImageToGallery = () => {
    const currentGallery = form.getValues("imageGalleryUrls") || [];
    form.setValue("imageGalleryUrls", [...currentGallery, ""]);
  };
  
  const removeImageFromGallery = (index: number) => {
    const currentGallery = form.getValues("imageGalleryUrls") || [];
    form.setValue("imageGalleryUrls", currentGallery.filter((_, i) => i !== index));
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
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="amenities">Amenities & Features</TabsTrigger>
            <TabsTrigger value="rooms">Room Types</TabsTrigger>
            <TabsTrigger value="roomImages">Room Images</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Hotel Information</CardTitle>
                <CardDescription>Enter the core details of the hotel property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price Per Night ($)</FormLabel>
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
                  name="hotelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accommodation Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select accommodation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="resort">Resort</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="independent_house">Independent House</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of accommodation you are listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the hotel and its unique features..." 
                          className="min-h-[150px]" 
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
                          placeholder="Enter the hotel's full address" 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Time</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 14:00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Format: 24-hour time (e.g., 14:00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Time</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 12:00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Format: 24-hour time (e.g., 12:00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Property</FormLabel>
                          <FormDescription>
                            Display on homepage featured section
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="freeCancellation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Free Cancellation</FormLabel>
                          <FormDescription>
                            Allows guests to cancel for free
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Images</CardTitle>
                <CardDescription>Upload main and gallery images for the property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter primary image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the main image displayed in listings and at the top of the details page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Image Gallery (Up to 10 images)</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addImageToGallery}
                      disabled={imageGallery.length >= 10}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  
                  <FormDescription>
                    Add multiple images to showcase different aspects of the hotel
                  </FormDescription>

                  {imageGallery.map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`imageGalleryUrls.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input placeholder={`Gallery image ${index + 1}`} {...field} />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeImageFromGallery(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
                <CardDescription>Specify what amenities and facilities are available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="amenitiesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotel Amenities (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Free WiFi&#10;Swimming Pool&#10;Fitness Center&#10;24/7 Room Service&#10;Spa&#10;Restaurant&#10;Bar&#10;Business Center&#10;Airport Shuttle&#10;Parking" 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each amenity or facility on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="languagesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages Spoken (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="English&#10;Arabic&#10;French&#10;Spanish" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each language on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="attractionsList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nearby Attractions (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Burj Khalifa (2 km)&#10;Dubai Mall (2.5 km)&#10;Dubai Fountain (2.2 km)&#10;Dubai Opera (1.5 km)" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each attraction with distance on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Room Types Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Room Types</CardTitle>
                <CardDescription>Specify the different room types available at this hotel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="roomTypesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Types (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'[\n  {\n    "name": "Standard Room",\n    "price": 0,\n    "maxOccupancy": 2,\n    "description": "Cozy room with city view",\n    "beds": "1 King or 2 Twin",\n    "amenities": ["TV", "Mini-bar", "Safe"]\n  },\n  {\n    "name": "Deluxe Room",\n    "price": 50,\n    "maxOccupancy": 2,\n    "description": "Spacious room with premium amenities",\n    "beds": "1 King",\n    "amenities": ["TV", "Mini-bar", "Safe", "Bathtub"]\n  }\n]'}
                          className="min-h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter room types in JSON format. The price field represents additional cost over base price.
                      </FormDescription>
                      <FormDescription className="mt-2 text-primary">
                        Note: After saving the hotel, use the Room Images tab to manage images for each room type.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Room Images Tab */}
          <TabsContent value="roomImages">
            <Card>
              <CardHeader>
                <CardTitle>Room Type Images</CardTitle>
                <CardDescription>Manage images for each room type in this hotel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {initialData ? (
                  <RoomImagesManager hotelId={initialData.id} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hotel not saved</AlertTitle>
                    <AlertDescription>
                      Please save the hotel first before managing room images.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Additional Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Additional Hotel Details</CardTitle>
                <CardDescription>Hotel policies and other important information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="userRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Rating (0-10)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="10" 
                          step="0.1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Average rating from guest reviews (out of 10)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="policiesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotel Policies (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'{\n  "cancellation": "Free cancellation up to 24 hours before check-in",\n  "payment": "Pay at property",\n  "pets": "Pets not allowed",\n  "children": "Children of all ages are welcome",\n  "extraBeds": "Extra beds available for $50 per night"\n}'}
                          className="min-h-[200px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Specify hotel policies in JSON format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData ? "Update Hotel" : "Create Hotel"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
