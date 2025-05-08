import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCruiseSchema, Cruise } from "@shared/schema";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extend the insert schema for form validation
const cruiseFormSchema = insertCruiseSchema.extend({
  // Convert some of the JSON string fields to more usable form types
  imageGalleryUrls: z.array(z.string()).optional(),
  amenitiesList: z.string().optional(),
  diningList: z.string().optional(),
  entertainmentList: z.string().optional(),
  includedServicesList: z.string().optional(),
  excludedServicesList: z.string().optional(),
  portsOfCallList: z.string().optional(),
  cabinTypesList: z.string().optional(),
  shipDetailsList: z.string().optional(),
  departureDate: z.date().optional(),
}).refine((data) => {
  if (data.departureDate && data.duration) {
    return true;
  }
  return true;
}, {
  message: "Both departure date and duration must be provided",
  path: ["departureDate"],
});

type CruiseFormValues = z.infer<typeof cruiseFormSchema>;

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

interface CruiseFormProps {
  initialData?: Cruise;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function CruiseForm({ initialData, onSubmit, isSubmitting }: CruiseFormProps) {
  // Parse initial data for form
  const defaultValues: Partial<CruiseFormValues> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    company: initialData?.company || "",
    shipName: initialData?.shipName || "",
    imageUrl: initialData?.imageUrl || "",
    imageGalleryUrls: parseJsonOrDefault(initialData?.imageGallery || null, []),
    duration: initialData?.duration || 7,
    price: initialData?.price || 0,
    departure: initialData?.departure || "",
    returnPort: initialData?.returnPort || "",
    departureDate: initialData?.departureDate ? new Date(initialData.departureDate) : undefined,
    boardingTime: initialData?.boardingTime || "16:00",
    itinerary: initialData?.itinerary || "",
    daysAtSea: initialData?.daysAtSea || 0,
    rating: initialData?.rating || 0,
    featured: initialData?.featured ?? false,
    familyFriendly: initialData?.familyFriendly ?? true,
    adultOnly: initialData?.adultOnly ?? false,
    
    // Convert JSON strings to textarea strings
    portsOfCallList: arrayToString(parseJsonOrDefault(initialData?.portsOfCall || null, [])),
    amenitiesList: arrayToString(parseJsonOrDefault(initialData?.amenities || null, [])), 
    diningList: arrayToString(parseJsonOrDefault(initialData?.dining || null, [])),
    entertainmentList: arrayToString(parseJsonOrDefault(initialData?.entertainment || null, [])),
    includedServicesList: arrayToString(parseJsonOrDefault(initialData?.includedServices || null, [])),
    excludedServicesList: arrayToString(parseJsonOrDefault(initialData?.excludedServices || null, [])),
    
    // Complex JSON objects
    cabinTypesList: stringifyJsonSafely(parseJsonOrDefault(initialData?.cabinTypes || null, [
      { type: "Interior", price: 0, description: "Cozy interior stateroom" },
      { type: "Ocean View", price: 200, description: "Room with a window view of the ocean" },
      { type: "Balcony", price: 500, description: "Room with private balcony" },
      { type: "Suite", price: 1200, description: "Luxury suite with separate living area" }
    ])),
    shipDetailsList: stringifyJsonSafely(parseJsonOrDefault(initialData?.shipDetails || null, {
      yearBuilt: 2018,
      tonnage: 160000,
      length: 1188,
      beam: 215,
      draft: 28,
      speed: 22,
      decks: 18,
      capacity: 5700
    })),
  };

  const form = useForm<CruiseFormValues>({
    resolver: zodResolver(cruiseFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: CruiseFormValues) => {
    // Format the data for database storage
    const formattedData = {
      ...data,
      // Convert form text fields to proper JSON strings for DB storage
      amenities: stringToArray(data.amenitiesList || ""),
      dining: stringToArray(data.diningList || ""),
      entertainment: stringToArray(data.entertainmentList || ""),
      includedServices: stringToArray(data.includedServicesList || ""),
      excludedServices: stringToArray(data.excludedServicesList || ""),
      portsOfCall: stringToArray(data.portsOfCallList || ""),
      cabinTypes: data.cabinTypesList,
      shipDetails: data.shipDetailsList,
      imageGallery: JSON.stringify(data.imageGalleryUrls || []),
    };
    
    // Remove temporary form-only fields before submission
    delete formattedData.amenitiesList;
    delete formattedData.diningList;
    delete formattedData.entertainmentList;
    delete formattedData.includedServicesList;
    delete formattedData.excludedServicesList;
    delete formattedData.portsOfCallList;
    delete formattedData.cabinTypesList;
    delete formattedData.shipDetailsList;
    delete formattedData.imageGalleryUrls;
    
    onSubmit(formattedData);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="schedule">Schedule & Itinerary</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="amenities">Amenities & Features</TabsTrigger>
            <TabsTrigger value="cabins">Cabin Types</TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Cruise Information</CardTitle>
                <CardDescription>Enter the core details of the cruise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cruise Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cruise name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cruise Line</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Royal Caribbean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shipName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ship Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Symphony of the Seas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                          />
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
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormDescription>Starting price for base interior cabin</FormDescription>
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
                          placeholder="Describe the cruise experience..." 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (0-5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="5" 
                            step="0.1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="daysAtSea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days at Sea</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <FormLabel>Featured Cruise</FormLabel>
                          <FormDescription>
                            Display on homepage featured section
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="familyFriendly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Family Friendly</FormLabel>
                          <FormDescription>
                            Suitable for families with children
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adultOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Adult Only</FormLabel>
                          <FormDescription>
                            Restricted to adults 18+ only
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Schedule & Itinerary Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Itinerary</CardTitle>
                <CardDescription>Set departure details and cruise itinerary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Port</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Miami, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="returnPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Port</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Miami, USA" {...field} />
                        </FormControl>
                        <FormDescription>If different from departure port</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departure Date</FormLabel>
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
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="boardingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boarding Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 16:00" {...field} />
                        </FormControl>
                        <FormDescription>Format: 24-hour time (e.g., 16:00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="itinerary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Itinerary (Day by Day)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Day 1: Depart Miami&#10;Day 2: At Sea&#10;Day 3: Jamaica&#10;Day 4: Cayman Islands&#10;Day 5: Cozumel, Mexico&#10;Day 6: At Sea&#10;Day 7: Return to Miami" 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="portsOfCallList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ports of Call (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nassau, Bahamas&#10;Charlotte Amalie, St. Thomas&#10;Philipsburg, St. Maarten" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each port visited during the cruise on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Cruise Images</CardTitle>
                <CardDescription>Upload main and gallery images for the cruise</CardDescription>
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
                    Add multiple images to showcase different aspects of the cruise ship and experience
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
          
          {/* Amenities & Features Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
                <CardDescription>Specify what's included in the cruise experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="shipDetailsList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ship Details (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'{\n  "yearBuilt": 2018,\n  "tonnage": 160000,\n  "length": 1188,\n  "beam": 215,\n  "draft": 28,\n  "speed": 22,\n  "decks": 18,\n  "capacity": 5700\n}'}
                          className="min-h-[200px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter ship specifications in JSON format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amenitiesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onboard Amenities (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Swimming Pools&#10;Water Slides&#10;Rock Climbing Wall&#10;Mini Golf&#10;Casino&#10;Spa&#10;Fitness Center&#10;Theater" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each amenity on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="diningList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dining Options (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Main Dining Room&#10;Buffet Restaurant&#10;Specialty Steakhouse&#10;Italian Restaurant&#10;Sushi Bar&#10;24-Hour Room Service&#10;Café & Bakery" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each dining venue on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="entertainmentList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entertainment Options (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Broadway-Style Shows&#10;Live Music&#10;Comedy Club&#10;Dance Club&#10;Karaoke&#10;Movie Theater&#10;Casino Games" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each entertainment option on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Cabin Types Tab */}
          <TabsContent value="cabins">
            <Card>
              <CardHeader>
                <CardTitle>Cabin Types & Inclusions</CardTitle>
                <CardDescription>Specify cabin options and what's included in the cruise package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cabinTypesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cabin Types (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'[\n  {\n    "type": "Interior",\n    "price": 0,\n    "description": "Cozy interior stateroom"\n  },\n  {\n    "type": "Ocean View",\n    "price": 200,\n    "description": "Room with a window view of the ocean"\n  },\n  {\n    "type": "Balcony",\n    "price": 500,\n    "description": "Room with private balcony"\n  },\n  {\n    "type": "Suite",\n    "price": 1200,\n    "description": "Luxury suite with separate living area"\n  }\n]'}
                          className="min-h-[300px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter cabin types in JSON format. The price field represents additional cost over base price.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includedServicesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Included Services (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="All meals in main dining venues&#10;Entertainment shows&#10;Access to pools and fitness center&#10;Port fees and taxes&#10;Room service (limited hours)&#10;Kids club activities" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List what's included in the base fare on separate lines
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excludedServicesList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Not Included (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specialty dining&#10;Alcoholic beverages&#10;Shore excursions&#10;Spa treatments&#10;Gratuities&#10;Internet packages&#10;Premium activities" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List what costs extra on separate lines
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
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData ? "Update Cruise" : "Create Cruise"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
