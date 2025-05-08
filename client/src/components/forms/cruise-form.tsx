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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extend the insert schema for form validation
const cruiseFormSchema = insertCruiseSchema.extend({
  inclusions: z.string().optional(),
  departureDate: z.date().optional(),
  returnDate: z.date().optional(),
}).refine((data) => {
  if (data.departureDate && data.returnDate) {
    return data.returnDate > data.departureDate;
  }
  return true;
}, {
  message: "Return date must be after departure date",
  path: ["returnDate"],
});

type CruiseFormValues = z.infer<typeof cruiseFormSchema>;

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
    imageUrl: initialData?.imageUrl || "",
    duration: initialData?.duration || 0,
    company: initialData?.company || "",
    route: initialData?.route || "",
    price: initialData?.price || 0,
    status: initialData?.status || "active",
    departureDate: initialData?.departureDate ? new Date(initialData.departureDate) : undefined,
    returnDate: initialData?.returnDate ? new Date(initialData.returnDate) : undefined,
    inclusions: initialData?.inclusions ? inclusionsArrayToString(initialData.inclusions as string[]) : "",
  };

  const form = useForm<CruiseFormValues>({
    resolver: zodResolver(cruiseFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: CruiseFormValues) => {
    // Format the data
    const formattedData = {
      ...data,
      inclusions: data.inclusions ? stringToInclusionsArray(data.inclusions) : [],
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <FormLabel>Cruise Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Royal Caribbean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Route</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Caribbean Islands" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the cruise..." 
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
            name="returnDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Return Date</FormLabel>
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
                        date < (form.getValues().departureDate || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="inclusions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inclusions (One per line)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="All meals&#10;Entertainment&#10;Port taxes&#10;Onboard activities" 
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
          ) : initialData ? "Update Cruise" : "Create Cruise"}
        </Button>
      </form>
    </Form>
  );
}
