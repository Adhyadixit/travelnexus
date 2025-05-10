import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { insertPackageSchema, Package, Destination } from "@shared/schema";
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
import { Loader2, Plus, X } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { ItineraryManager } from "@/components/itinerary/itinerary-manager";
import { type CheckedState } from "@radix-ui/react-checkbox";

// Extend the insert schema for form validation
const packageFormSchema = insertPackageSchema.extend({
  // Convert some of the JSON string fields to more usable form types
  destinationId: z.string(), // Store ID as string in form for select component
  imageGalleryUrls: z.array(z.string()).optional(),
  includedItems: z.string().optional(),
  excludedItems: z.string().optional(),
  itineraryText: z.string().optional(),
  hotelsText: z.string().optional(),
  citiesCoveredText: z.string().optional(),
  mealsText: z.string().optional(),
  startingDatesText: z.string().optional(),
  highlightsText: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

// Helper functions for converting between form and DB formats

// Helper function to safely convert field value to CheckedState
const asCheckedState = (value: boolean | null | undefined): CheckedState => {
  if (value === true) return true;
  return false;
};

// Helper function to safely handle string values
const asString = (value: string | null | undefined): string => {
  if (typeof value === 'string') return value;
  return "";
};
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

interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function PackageForm({ initialData, onSubmit, isSubmitting }: PackageFormProps) {
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  // Parse initial data for form
  const defaultValues: Partial<PackageFormValues> = {
    name: initialData?.name || "",
    destinationId: initialData?.destinationId ? initialData.destinationId.toString() : "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    imageGalleryUrls: parseJsonOrDefault(initialData?.imageGallery || null, []),
    duration: initialData?.duration || 7,
    price: initialData?.price || 0,
    includedItems: arrayToString(parseJsonOrDefault(initialData?.included || null, [])),
    excludedItems: arrayToString(parseJsonOrDefault(initialData?.excluded || null, [])),
    trending: initialData?.trending ?? false,
    featured: initialData?.featured ?? false,
    itineraryText: stringifyJsonSafely(parseJsonOrDefault(initialData?.itinerary || null, {})),
    hotelsText: stringifyJsonSafely(parseJsonOrDefault(initialData?.hotels || null, [])),
    flightIncluded: initialData?.flightIncluded ?? false,
    visaRequired: initialData?.visaRequired ?? false,
    visaAssistance: initialData?.visaAssistance ?? false,
    typeOfTour: initialData?.typeOfTour || "Group",
    citiesCoveredText: arrayToString(parseJsonOrDefault(initialData?.citiesCovered || null, [])),
    mealsText: stringifyJsonSafely(parseJsonOrDefault(initialData?.meals || null, { breakfast: true, lunch: false, dinner: false })),
    startingDatesText: arrayToString(parseJsonOrDefault(initialData?.startingDates || null, [])),
    travelMode: initialData?.travelMode || "Flight",
    minTravelers: initialData?.minTravelers ?? 1,
    customizable: initialData?.customizable ?? false,
    highlightsText: arrayToString(parseJsonOrDefault(initialData?.highlights || null, [])),
  };

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: PackageFormValues) => {
    try {
      // Format the data for database storage
      console.log("Form data before formatting:", data);
      const formattedData = {
        ...data,
        destinationId: parseInt(data.destinationId),
        // Convert form text fields to proper JSON strings for DB storage
        included: stringToArray(data.includedItems || ""),
        excluded: stringToArray(data.excludedItems || ""),
        itinerary: data.itineraryText,
        hotels: data.hotelsText,
        citiesCovered: stringToArray(data.citiesCoveredText || ""), 
        meals: data.mealsText,
        startingDates: stringToArray(data.startingDatesText || ""),
        highlights: stringToArray(data.highlightsText || ""),
        imageGallery: JSON.stringify(data.imageGalleryUrls || []),
      };
      
      // Remove temporary form-only fields before submission
      delete formattedData.includedItems;
      delete formattedData.excludedItems;
      delete formattedData.itineraryText;
      delete formattedData.hotelsText;
      delete formattedData.citiesCoveredText;
      delete formattedData.mealsText;
      delete formattedData.startingDatesText;
      delete formattedData.highlightsText;
      delete formattedData.imageGalleryUrls;
      
      console.log("Formatted data for submission:", formattedData);
      onSubmit(formattedData);
    } catch (error) {
      console.error("Error in package form submission:", error);
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
            <TabsTrigger value="inclusions">Inclusions/Exclusions</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Package Information</CardTitle>
                <CardDescription>Enter the core details of the package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter package name" {...field} />
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
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
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
                        <FormLabel>Price ($)</FormLabel>
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
                          placeholder="Describe the package..." 
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
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={asCheckedState(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Package</FormLabel>
                          <FormDescription>
                            Show this package on the homepage
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trending"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={asCheckedState(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Trending</FormLabel>
                          <FormDescription>
                            Mark as a trending package
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customizable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={asCheckedState(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Customizable</FormLabel>
                          <FormDescription>
                            Allow custom modifications
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
                <CardTitle>Package Images</CardTitle>
                <CardDescription>Upload primary and gallery images for the package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Image</FormLabel>
                      <FormControl>
                        <ImageUpload 
                          value={field.value}
                          onChange={field.onChange}
                          folder="packages"
                        />
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
                    Add multiple images to showcase different aspects of the package
                  </FormDescription>

                  {imageGallery.map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`imageGalleryUrls.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col gap-2">
                            <FormControl>
                              <ImageUpload 
                                value={field.value}
                                onChange={field.onChange}
                                folder="packages/gallery"
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeImageFromGallery(index)}
                              className="self-end"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove Image
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
          
          {/* Inclusions/Exclusions Tab */}
          <TabsContent value="inclusions">
            <Card>
              <CardHeader>
                <CardTitle>What's Included & Excluded</CardTitle>
                <CardDescription>Specify what's included and excluded in the package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="includedItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's Included (One item per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Hotel accommodation&#10;Airport transfer&#10;Daily breakfast&#10;Guided tours" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each included item on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excludedItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's Excluded (One item per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="International flights&#10;Travel insurance&#10;Personal expenses&#10;Optional tours" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each excluded item on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="flightIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={asCheckedState(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Flight Included</FormLabel>
                          <FormDescription>
                            Package includes flights
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visaRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={asCheckedState(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Visa Required</FormLabel>
                          <FormDescription>
                            Visa is required for this destination
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="visaAssistance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={asCheckedState(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visa Assistance</FormLabel>
                        <FormDescription>
                          We provide visa assistance services
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle>Itinerary & Highlights</CardTitle>
                <CardDescription>Day-by-day plan and key highlights of the package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="itineraryText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day-by-Day Itinerary</FormLabel>
                      <FormControl>
                        <div className="border rounded-md p-4 bg-background">
                          <ItineraryManager 
                            value={field.value || '{}'}
                            onChange={field.onChange}
                            duration={parseInt(form.getValues().duration?.toString() || '1')}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Create a detailed itinerary for each day of the package
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="highlightsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Highlights (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Visit to Burj Khalifa&#10;Desert Safari Adventure&#10;Dhow Cruise with Dinner&#10;Shopping at Dubai Mall" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each highlight on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="citiesCoveredText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cities Covered (One per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dubai&#10;Abu Dhabi&#10;Sharjah" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List each city on a separate line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Additional Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>Important details that make the package special</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="typeOfTour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tour Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={asString(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tour type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Group">Group Tour</SelectItem>
                            <SelectItem value="Private">Private Tour</SelectItem>
                            <SelectItem value="Self-Guided">Self-Guided</SelectItem>
                            <SelectItem value="Customizable">Customizable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="travelMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select travel mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Flight">Flight</SelectItem>
                            <SelectItem value="Train">Train</SelectItem>
                            <SelectItem value="Bus">Bus</SelectItem>
                            <SelectItem value="Cruise">Cruise</SelectItem>
                            <SelectItem value="Car">Car</SelectItem>
                            <SelectItem value="Multiple">Multiple Modes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minTravelers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Travelers</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startingDatesText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Dates (One per line)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="2025-01-15&#10;2025-02-01&#10;2025-02-15" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          List available starting dates in YYYY-MM-DD format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="hotelsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotels (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'[\n  {\n    "name": "Burj Al Arab",\n    "rating": 5,\n    "nights": 2\n  },\n  {\n    "name": "Atlantis The Palm",\n    "rating": 5,\n    "nights": 3\n  }\n]'}
                          className="min-h-[200px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter hotels in JSON format with name, rating, and nights for each
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mealsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Included Meals (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={'{\n  "breakfast": true,\n  "lunch": false,\n  "dinner": true\n}'}
                          className="min-h-[150px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Specify which meals are included in the package
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
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
            ) : initialData ? "Update Package" : "Create Package"}
          </Button>
          
          {/* Manual submit button that bypasses the form submit */}
          <Button 
            type="button" 
            size="lg"
            variant="secondary"
            className="min-w-[150px]"
            onClick={() => {
              console.log("Manual submit triggered");
              const data = form.getValues();
              console.log("Current form values:", data);
              
              try {
                const formattedData = {
                  ...data,
                  destinationId: parseInt(data.destinationId),
                  included: stringToArray(data.includedItems || ""),
                  excluded: stringToArray(data.excludedItems || ""),
                  itinerary: data.itineraryText,
                  hotels: data.hotelsText,
                  citiesCovered: stringToArray(data.citiesCoveredText || ""), 
                  meals: data.mealsText,
                  startingDates: stringToArray(data.startingDatesText || ""),
                  highlights: stringToArray(data.highlightsText || ""),
                  imageGallery: JSON.stringify(data.imageGalleryUrls || []),
                };
                
                // Remove temporary form-only fields
                delete formattedData.includedItems;
                delete formattedData.excludedItems;
                delete formattedData.itineraryText;
                delete formattedData.hotelsText;
                delete formattedData.citiesCoveredText;
                delete formattedData.mealsText;
                delete formattedData.startingDatesText;
                delete formattedData.highlightsText;
                delete formattedData.imageGalleryUrls;
                
                console.log("Manually formatted data for submission:", formattedData);
                onSubmit(formattedData);
              } catch (error) {
                console.error("Error in manual package form submission:", error);
              }
            }}
          >
            Manual Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}
