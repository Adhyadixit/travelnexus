import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Event, Destination, insertEventSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Search, Edit, Trash, Plus, CalendarDays } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const eventFormSchema = insertEventSchema.extend({
  destinationId: z.coerce.number().positive("Please select a destination"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  date: z.date({
    required_error: "Please select a date",
  }),
});

type EventFormValues = Omit<z.infer<typeof eventFormSchema>, "date"> & {
  date: Date;
};

export default function AdminEvents() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all events
  const { 
    data: events = [],
    isLoading: isLoadingEvents
  } = useQuery<Event[]>({
    queryKey: ["/api/events/admin"],
  });
  
  // Fetch all destinations
  const {
    data: destinations = [],
    isLoading: isLoadingDestinations
  } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Create form
  const createForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      location: "",
      price: 0,
      capacity: 50,
      available: true,
      date: new Date(),
      destinationId: 0,
    },
  });
  
  // Edit form
  const editForm = useForm<EventFormValues & { id: number }>({
    resolver: zodResolver(eventFormSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      name: "",
      description: "",
      imageUrl: "",
      location: "",
      price: 0,
      capacity: 50,
      available: true,
      date: new Date(),
      destinationId: 0,
    },
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      // Convert Date to ISO string for API
      const apiData = {
        ...data,
        date: data.date.toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/events", apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormValues & { id: number }) => {
      const { id, ...eventData } = data;
      // Convert Date to ISO string for API
      const apiData = {
        ...eventData,
        date: eventData.date.toISOString(),
      };
      
      const response = await apiRequest("PATCH", `/api/events/${id}`, apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/events/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle create form submission
  const onCreateSubmit = (data: EventFormValues) => {
    createEventMutation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: EventFormValues & { id: number }) => {
    updateEventMutation.mutate(data);
  };
  
  // Handle delete
  const onDelete = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      id: event.id,
      name: event.name,
      description: event.description,
      imageUrl: event.imageUrl,
      location: event.location,
      price: event.price,
      capacity: event.capacity,
      available: event.available,
      date: new Date(event.date),
      destinationId: event.destinationId || 0,
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };
  
  // Get destination name by ID
  const getDestinationName = (id: number) => {
    const destination = destinations.find(dest => dest.id === id);
    return destination ? destination.name : "Unknown";
  };
  
  // Filter events based on search query
  const filteredEvents = searchQuery 
    ? events.filter(event => 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;
    
  const isLoading = isLoadingEvents || isLoadingDestinations;
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">Manage Events</h1>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Event
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center border border-input rounded-md pl-3 mb-6">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="border-0 focus-visible:ring-0" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">No Events Found</p>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Add your first event to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{formatDate(event.date)}</TableCell>
                        <TableCell>{event.destinationId ? getDestinationName(event.destinationId) : "Global"}</TableCell>
                        <TableCell>{formatCurrency(event.price)}</TableCell>
                        <TableCell>
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.available 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {event.available ? "Available" : "Unavailable"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClick(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(event)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event for your customers
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tokyo Cultural Festival" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the event experience"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Central Park" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {destinations.map((destination) => (
                            <SelectItem 
                              key={destination.id} 
                              value={destination.id.toString()}
                            >
                              {destination.name}, {destination.country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Event Date</FormLabel>
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
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
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
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEventMutation.isPending}
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {destinations.map((destination) => (
                            <SelectItem 
                              key={destination.id} 
                              value={destination.id.toString()}
                            >
                              {destination.name}, {destination.country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Event Date</FormLabel>
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
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateEventMutation.isPending}
                >
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={onDelete}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}