import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { insertCabSchema, Cab, Destination } from "@shared/schema";
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
import { Loader2 } from "lucide-react";

// Extend the insert schema for form validation
const cabFormSchema = insertCabSchema.extend({
  languages: z.string().min(1, "Languages are required"),
});

type CabFormValues = z.infer<typeof cabFormSchema>;

// Function to convert languages string to JSON and back
const stringToLanguagesArray = (languages: string): string[] => {
  try {
    return languages.split(',').map(lang => lang.trim()).filter(lang => lang !== '');
  } catch (e) {
    return [];
  }
};

const languagesArrayToString = (languages: string[] | null): string => {
  if (!languages) return '';
  return languages.join(', ');
};

interface CabFormProps {
  initialData?: Cab;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function CabForm({ initialData, onSubmit, isSubmitting }: CabFormProps) {
  const { data: destinations, isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  // Parse initial data for form
  const defaultValues: Partial<CabFormValues> = {
    driverName: initialData?.driverName || "",
    destinationId: initialData?.destinationId.toString() || "",
    profileImageUrl: initialData?.profileImageUrl || "",
    vehicleImageUrl: initialData?.vehicleImageUrl || "",
    vehicleModel: initialData?.vehicleModel || "",
    languages: initialData?.languages ? languagesArrayToString(initialData.languages as string[]) : "",
    dailyRate: initialData?.dailyRate || 0,
  };

  const form = useForm<CabFormValues>({
    resolver: zodResolver(cabFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: CabFormValues) => {
    // Convert languages string to JSON array
    const formattedData = {
      ...data,
      destinationId: parseInt(data.destinationId),
      languages: stringToLanguagesArray(data.languages),
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
          name="driverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter driver name" {...field} />
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
            name="vehicleModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mercedes S-Class" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Rate ($)</FormLabel>
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
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Languages (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="English, Spanish, French" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="profileImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter driver profile image URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="vehicleImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter vehicle image URL" {...field} />
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
          ) : initialData ? "Update Driver" : "Create Driver"}
        </Button>
      </form>
    </Form>
  );
}
