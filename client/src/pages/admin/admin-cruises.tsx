import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Cruise, insertCruiseSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Search, Edit, Trash, Plus, Ship } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const cruiseFormSchema = insertCruiseSchema.extend({
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day"),
  // Not part of the actual database schema but needed for the form
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  available: z.boolean().optional().default(true),
});

type CruiseFormValues = z.infer<typeof cruiseFormSchema>;

export default function AdminCruises() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCruise, setSelectedCruise] = useState<Cruise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all cruises with direct database access
  const { 
    data: cruises = [],
    isLoading
  } = useQuery<Cruise[]>({
    queryKey: ["/api/direct/cruises"],
  });
  
  // Create form
  const createForm = useForm<CruiseFormValues>({
    resolver: zodResolver(cruiseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
      duration: 1,
      capacity: 100,
      itinerary: "",
      available: true,
      featured: false,
    },
  });
  
  // Edit form
  const editForm = useForm<CruiseFormValues & { id: number }>({
    resolver: zodResolver(cruiseFormSchema.extend({ 
      id: z.number(),
      company: z.string().min(1, "Cruise line company is required"),
      shipName: z.string().min(1, "Ship name is required"),
      departure: z.string().min(1, "Departure port is required"),
      returnPort: z.string().optional(),
      imageGallery: z.string().optional(),
      boardingTime: z.string().optional(),
      portsOfCall: z.string().optional(),
      daysAtSea: z.coerce.number().min(0).optional(),
      cabinTypes: z.string().optional(),
      amenities: z.string().optional(),
      dining: z.string().optional(),
      entertainment: z.string().optional(),
      shipDetails: z.string().optional(),
      includedServices: z.string().optional(),
      excludedServices: z.string().optional(),
      familyFriendly: z.boolean().optional().default(true),
      adultOnly: z.boolean().optional().default(false),
    })),
    defaultValues: {
      id: 0,
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
      duration: 1,
      capacity: 100,
      itinerary: "",
      available: true,
      featured: false,
      
      // Additional fields
      company: "",
      shipName: "",
      departure: "",
      returnPort: "",
      imageGallery: "",
      boardingTime: "",
      portsOfCall: "",
      daysAtSea: 0,
      cabinTypes: "",
      amenities: "",
      dining: "",
      entertainment: "",
      shipDetails: "",
      includedServices: "",
      excludedServices: "",
      familyFriendly: true,
      adultOnly: false,
    },
  });
  
  // Create cruise mutation
  const createCruiseMutation = useMutation({
    mutationFn: async (data: CruiseFormValues) => {
      const response = await apiRequest("POST", "/api/cruises", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cruises/admin"] });
      toast({
        title: "Success",
        description: "Cruise created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create cruise: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update cruise mutation
  const updateCruiseMutation = useMutation({
    mutationFn: async (data: CruiseFormValues & { id: number }) => {
      const { id, ...cruiseData } = data;
      const response = await apiRequest("PATCH", `/api/cruises/${id}`, cruiseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cruises/admin"] });
      toast({
        title: "Success",
        description: "Cruise updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedCruise(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update cruise: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete cruise mutation
  const deleteCruiseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cruises/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cruises/admin"] });
      toast({
        title: "Success",
        description: "Cruise deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCruise(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete cruise: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle create form submission
  const onCreateSubmit = (data: CruiseFormValues) => {
    createCruiseMutation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: CruiseFormValues & { id: number }) => {
    updateCruiseMutation.mutate(data);
  };
  
  // Handle delete
  const onDelete = () => {
    if (selectedCruise) {
      deleteCruiseMutation.mutate(selectedCruise.id);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (cruise: Cruise) => {
    setSelectedCruise(cruise);
    
    // We need to handle properties that might not exist in the database schema
    // But are used in our form for UI purposes
    editForm.reset({
      id: cruise.id,
      name: cruise.name,
      description: cruise.description,
      imageUrl: cruise.imageUrl,
      price: cruise.price,
      duration: cruise.duration,
      company: cruise.company,
      departure: cruise.departure,
      
      // Additional properties from the schema
      shipName: cruise.shipName || '',
      returnPort: cruise.returnPort || '',
      imageGallery: cruise.imageGallery || '',
      boardingTime: cruise.boardingTime || '',
      portsOfCall: cruise.portsOfCall || '',
      daysAtSea: cruise.daysAtSea || 0,
      cabinTypes: cruise.cabinTypes || '',
      amenities: cruise.amenities || '',
      dining: cruise.dining || '',
      entertainment: cruise.entertainment || '',
      shipDetails: cruise.shipDetails || '',
      includedServices: cruise.includedServices || '',
      excludedServices: cruise.excludedServices || '',
      familyFriendly: cruise.familyFriendly || true,
      adultOnly: cruise.adultOnly || false,
      
      // UI-specific values not in the DB
      capacity: 100,
      itinerary: cruise.itinerary || '{}',
      available: true,
      featured: cruise.featured || false,
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDeleteClick = (cruise: Cruise) => {
    setSelectedCruise(cruise);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter cruises based on search query
  const filteredCruises = searchQuery 
    ? cruises.filter(cruise => 
        cruise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cruise.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cruises;
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">Manage Cruises</h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New Cruise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Cruise</DialogTitle>
                <DialogDescription>
                  Create a new cruise option for your customers
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cruise Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Caribbean Paradise Cruise" {...field} />
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
                            placeholder="Describe the cruise experience"
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (days)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
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
                  
                  <FormField
                    control={createForm.control}
                    name="itinerary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Itinerary (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"day1": "Departure", "day2": "At Sea", "day3": "Port Visit"}'
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCruiseMutation.isPending}>
                      {createCruiseMutation.isPending ? "Creating..." : "Create Cruise"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Cruises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or description..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Cruises</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCruises.length === 0 ? (
              <div className="text-center py-6">
                <Ship className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">No Cruises Found</p>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Add your first cruise to get started"}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Cruise
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCruises.map((cruise) => (
                      <TableRow key={cruise.id}>
                        <TableCell className="font-medium">{cruise.name}</TableCell>
                        <TableCell>{cruise.duration} days</TableCell>
                        <TableCell>100 passengers</TableCell>
                        <TableCell>{formatCurrency(cruise.price)}</TableCell>
                        <TableCell>
                          <div className="px-2 py-1 rounded-full text-xs font-medium inline-block bg-green-100 text-green-800">
                            Available
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(cruise)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(cruise)}
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
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cruise</DialogTitle>
            <DialogDescription>
              Update cruise information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cruise Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cruise Line</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Royal Caribbean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="shipName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ship Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Oasis of the Seas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                </div>
                
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
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Images</h3>
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="imageGallery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Images (JSON array of URLs)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Trip Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
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
                        <FormLabel>Ship Capacity</FormLabel>
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
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Port</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Miami, Florida" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="returnPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Port (if different)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fort Lauderdale, Florida" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="boardingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boarding Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3:00 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="daysAtSea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days at Sea</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Itinerary & Ports</h3>
                <FormField
                  control={editForm.control}
                  name="itinerary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Itinerary (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"day1": "Departure from Miami", "day2": "At Sea", "day3": "Nassau, Bahamas"}'
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="portsOfCall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ports of Call (JSON array)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='["Nassau, Bahamas", "Charlotte Amalie, St. Thomas", "Philipsburg, St. Maarten"]'
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Ship Amenities & Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="cabinTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cabin Types (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"interior": "From $799", "oceanview": "From $999", "balcony": "From $1299", "suite": "From $1999"}'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onboard Amenities (JSON array)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='["Swimming Pools", "Spa", "Fitness Center", "Casino", "Theater"]'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="dining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dining Options (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"main_dining": "Included", "specialty": "Additional fee", "buffet": "Included", "cafes": "Some included"}'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="entertainment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entertainment (JSON array)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='["Broadway Shows", "Live Music", "Comedy Club", "Nightclub", "Movies"]'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="shipDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ship Details (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"year_built": "2009", "refurbished": "2019", "tonnage": "225,282", "length": "1,188 ft", "crew": "2,200"}'
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Included/Excluded & Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="includedServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Included Services (JSON array)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='["Accommodations", "All meals in main dining venues", "Entertainment", "Port fees"]'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="excludedServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excluded Services (JSON array)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='["Gratuities", "Alcoholic beverages", "Specialty dining", "Shore excursions", "WiFi"]'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="familyFriendly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Family Friendly</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Suitable for families with children
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="adultOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Adult Only</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Restricted to passengers 18+ or 21+ years old
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Display Settings</h3>
                <FormField
                  control={editForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Cruise</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Display this cruise in featured sections
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCruiseMutation.isPending}>
                  {updateCruiseMutation.isPending ? "Updating..." : "Update Cruise"}
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
              Are you sure you want to delete "{selectedCruise?.name}"? This action cannot be undone.
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
              disabled={deleteCruiseMutation.isPending}
            >
              {deleteCruiseMutation.isPending ? "Deleting..." : "Delete Cruise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}