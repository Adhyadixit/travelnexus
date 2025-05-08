import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const searchFormSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  checkIn: z.date({
    required_error: "Check-in date is required",
  }),
  checkOut: z.date({
    required_error: "Check-out date is required",
  }),
  travelers: z.string().min(1, "Number of travelers is required"),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
  className?: string;
  variant?: "hero" | "compact";
}

export function SearchForm({ className, variant = "hero" }: SearchFormProps) {
  const [, navigate] = useNavigate();
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      destination: "",
      travelers: "2 Adults",
    },
  });

  function onSubmit(data: SearchFormValues) {
    // In a real application, this would use the search parameters
    // For now, we'll just navigate to the destinations page
    navigate("/destinations");
  }

  const isCompact = variant === "compact";

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-5xl mx-auto",
      className
    )}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={cn(
          isCompact ? "flex flex-wrap items-end gap-2" : "space-y-4"
        )}>
          <div className={cn(
            "grid gap-4",
            isCompact ? "grid-cols-1 md:grid-cols-5 w-full" : "grid-cols-1 md:grid-cols-4"
          )}>
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className={isCompact ? "md:col-span-2" : ""}>
                  <FormLabel className={cn(
                    "text-neutral-600 font-medium",
                    isCompact && "text-sm"
                  )}>
                    Destination
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Where to?" 
                      {...field} 
                      className="w-full"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(
                    "text-neutral-600 font-medium",
                    isCompact && "text-sm"
                  )}>
                    Check-in
                  </FormLabel>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkOut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(
                    "text-neutral-600 font-medium",
                    isCompact && "text-sm"
                  )}>
                    Check-out
                  </FormLabel>
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
                          date < (form.getValues().checkIn || new Date())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="travelers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(
                    "text-neutral-600 font-medium",
                    isCompact && "text-sm"
                  )}>
                    Travelers
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select travelers" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1 Adult">1 Adult</SelectItem>
                      <SelectItem value="2 Adults">2 Adults</SelectItem>
                      <SelectItem value="2 Adults, 1 Child">2 Adults, 1 Child</SelectItem>
                      <SelectItem value="2 Adults, 2 Children">2 Adults, 2 Children</SelectItem>
                      <SelectItem value="Family Pack">Family Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className={cn(
              "flex items-center",
              isCompact
                ? "py-2 md:h-10 md:mt-0 mt-2"
                : "px-8 py-3 bg-secondary hover:bg-secondary-dark w-full md:w-auto md:mx-auto mt-4"
            )}
            size={isCompact ? "sm" : "lg"}
            variant={isCompact ? "default" : "secondary"}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default SearchForm;
