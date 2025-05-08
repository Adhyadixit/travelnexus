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
const packageFormSchema = insertPackageSchema.extend({
  inclusions: z.string().min(1, "Inclusions are required").optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

// Function to convert inclusions string to JSON and back
const stringToInclusionsArray = (inclusions: string): string[] => {
  try {
    return inclusions.split('\n').filter(line => line.trim() !== '');
  } catch (e) {
    return [];
  }
};

const inclusionsArrayToString = (inclusions: string[] | null): string => {
  if (!inclusions) return '';
  return inclusions.join('\n');
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
    destinationId: initialData?.destinationId.toString() || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    duration: initialData?.duration || 0,
    price: initialData?.price || 0,
    status: initialData?.status || "active",
    inclusions: initialData?.inclusions ? inclusionsArrayToString(initialData.inclusions as string[]) : "",
  };

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: PackageFormValues) => {
    // Convert inclusions string to JSON array
    const formattedData = {
      ...data,
      destinationId: parseInt(data.destinationId),
      inclusions: data.inclusions ? stringToInclusionsArray(data.inclusions) : [],
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
          name="inclusions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inclusions (One per line)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Hotel accommodation&#10;Airport transfer&#10;Daily breakfast&#10;Guided tours" 
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
          ) : initialData ? "Update Package" : "Create Package"}
        </Button>
      </form>
    </Form>
  );
}
