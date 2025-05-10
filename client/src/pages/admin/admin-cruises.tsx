import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Cruise, insertCruiseSchema, CruiseCabinType, insertCruiseCabinTypeSchema } from "@shared/schema";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Search, Edit, Trash, Plus, Ship, X, Bed } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const cruiseFormSchema = insertCruiseSchema.extend({
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day"),
  // Not part of the actual database schema but needed for the form
  imageGallery: z.string().optional().default("[]"),
  cabinTypes: z.string().optional().default("[]"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  available: z.boolean().optional().default(true),
});

// Schema for the cabin type form
const cabinTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  features: z.string().optional().default("[]"),
  image: z.string().min(1, "Image is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  availability: z.coerce.number().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

type CruiseFormValues = z.infer<typeof cruiseFormSchema>;
type CabinTypeFormValues = z.infer<typeof cabinTypeFormSchema>;

export default function AdminCruises() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCruise, setSelectedCruise] = useState<Cruise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cabin type management states
  const [cabinTypes, setCabinTypes] = useState<CruiseCabinType[]>([]);
  const [editingCabinType, setEditingCabinType] = useState<CruiseCabinType | null>(null);
  
  // Fetch cabin types when a cruise is selected for editing
  useEffect(() => {
    if (selectedCruise?.id) {
      // Fetch cabin types for the selected cruise
      apiRequest("GET", `/api/cruises/${selectedCruise.id}/cabin-types`)
        .then(res => res.json())
        .then(data => {
          setCabinTypes(data);
        })
        .catch(error => {
          console.error("Error fetching cabin types:", error);
          toast({
            title: "Error",
            description: "Failed to load cabin types for this cruise.",
            variant: "destructive",
          });
        });
    } else {
      // Clear cabin types when no cruise is selected
      setCabinTypes([]);
    }
  }, [selectedCruise?.id]);
  
  // Add Cabin Type Form
  const addCabinTypeForm = useForm<CabinTypeFormValues>({
    resolver: zodResolver(cabinTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      capacity: 2,
      image: "",
      features: "[]"
    }
  });

  // Edit Cabin Type Form
  const editCabinTypeForm = useForm<CabinTypeFormValues & { id: number }>({
    resolver: zodResolver(cabinTypeFormSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      name: "",
      description: "",
      price: 0,
      capacity: 2,
      image: "",
      features: "[]"
    }
  });

  // Update editCabinTypeForm when a cabin type is selected for editing
  useEffect(() => {
    if (editingCabinType) {
      editCabinTypeForm.reset({
        id: editingCabinType.id,
        name: editingCabinType.name,
        description: editingCabinType.description || "",
        price: editingCabinType.price,
        capacity: editingCabinType.capacity || 2,
        image: editingCabinType.image || "",
        features: editingCabinType.features || "[]",
        featured: editingCabinType.featured || false,
        availability: editingCabinType.availability || 10,
        active: editingCabinType.active || true
      });
    }
  }, [editingCabinType]);

  // Cabin Type Mutations
  const addCabinTypeMutation = useMutation({
    mutationFn: async (cabinType: Partial<CruiseCabinType>) => {
      if (!selectedCruise?.id) throw new Error("No cruise selected");
      
      const res = await apiRequest("POST", `/api/cruises/${selectedCruise.id}/cabin-types`, cabinType);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cruises/${selectedCruise?.id}/cabin-types`] });
      toast({
        title: "Success",
        description: "Cabin type added successfully",
      });
      // No need to close any dialog, just reset the form
      addCabinTypeForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add cabin type",
        variant: "destructive",
      });
    }
  });
  
  const updateCabinTypeMutation = useMutation({
    mutationFn: async (cabinType: Partial<CruiseCabinType>) => {
      if (!selectedCruise?.id) throw new Error("No cruise selected");
      
      const res = await apiRequest("PATCH", `/api/cruises/${selectedCruise.id}/cabin-types/${cabinType.id}`, cabinType);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cruises/${selectedCruise?.id}/cabin-types`] });
      toast({
        title: "Success",
        description: "Cabin type updated successfully",
      });
      setEditingCabinType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update cabin type",
        variant: "destructive",
      });
    }
  });
  
  const deleteCabinTypeMutation = useMutation({
    mutationFn: async (cabinTypeId: number) => {
      if (!selectedCruise?.id) throw new Error("No cruise selected");
      
      const res = await apiRequest("DELETE", `/api/cruises/${selectedCruise.id}/cabin-types/${cabinTypeId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cruises/${selectedCruise?.id}/cabin-types`] });
      toast({
        title: "Success",
        description: "Cabin type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cabin type",
        variant: "destructive",
      });
    }
  });

  // Submit handlers for cabin type forms
  const onAddCabinTypeSubmit = async (data: CabinTypeFormValues) => {
    if (!selectedCruise?.id) return;
    
    try {
      await addCabinTypeMutation.mutateAsync({
        ...data,
        cruiseId: selectedCruise.id
      });
    } catch (error) {
      console.error("Error adding cabin type:", error);
    }
  };

  const onEditCabinTypeSubmit = async (data: CabinTypeFormValues & { id: number }) => {
    if (!selectedCruise?.id) {
      console.error("No cruise selected");
      toast({
        title: "Error",
        description: "No cruise selected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateCabinTypeMutation.mutateAsync({
        ...data,
        cruiseId: selectedCruise.id
      });
    } catch (error) {
      console.error("Error updating cabin type:", error);
    }
  };
  
  // Fetch all cruises using direct database access
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
      imageGallery: "[]",
      cabinTypes: "[]",
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
      const response = await apiRequest("POST", "/api/admin/cruises", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/cruises"] });
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
      const response = await apiRequest("PUT", `/api/admin/cruises/${id}`, cruiseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/cruises"] });
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
      await apiRequest("DELETE", `/api/admin/cruises/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/cruises"] });
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
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cruise Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Mediterranean Dream Cruise" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cruise Line</FormLabel>
                          <FormControl>
                            <Input placeholder="Royal Caribbean, Carnival, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Price (USD)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Days)</FormLabel>
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
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Image</FormLabel>
                        <FormControl>
                          <ImageUpload 
                            value={field.value || ''}
                            onChange={field.onChange}
                            folder="travelease/cruises"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="departure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departure Port</FormLabel>
                          <FormControl>
                            <Input placeholder="Miami, Venice, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
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
                            <FormLabel>Featured</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Show this cruise in featured sections
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createCruiseMutation.isPending}>
                      {createCruiseMutation.isPending ? "Creating..." : "Create Cruise"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cruises..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <div className="space-x-2">
                    <Skeleton className="h-8 w-8 inline-block" />
                    <Skeleton className="h-8 w-8 inline-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCruises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Ship className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No cruises found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          Add your first cruise
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCruises.map((cruise) => (
                    <TableRow key={cruise.id}>
                      <TableCell>
                        <div className="font-medium">{cruise.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-md">
                          {cruise.departure}
                        </div>
                      </TableCell>
                      <TableCell>{cruise.company}</TableCell>
                      <TableCell>{cruise.duration} days</TableCell>
                      <TableCell>{formatCurrency(cruise.price)}</TableCell>
                      <TableCell>
                        {cruise.featured && (
                          <Badge className="mr-1">Featured</Badge>
                        )}
                        {cruise.available ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Unavailable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(cruise)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(cruise)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cruise</DialogTitle>
            <DialogDescription>
              Update the details for {selectedCruise?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cruise Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Mediterranean Dream Cruise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cruise Line</FormLabel>
                        <FormControl>
                          <Input placeholder="Royal Caribbean, Carnival, etc." {...field} />
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
                          <Input placeholder="Allure of the Seas, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={editForm.control}
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
                    control={editForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Image</FormLabel>
                        <FormControl>
                          <ImageUpload 
                            value={field.value || ''}
                            onChange={field.onChange}
                            folder="travelease/cruises"
                          />
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
                        <FormLabel>Image Gallery (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='["url1.jpg", "url2.jpg", "url3.jpg"]'
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter image URLs as a JSON array
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Itinerary & Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Port</FormLabel>
                        <FormControl>
                          <Input placeholder="Miami, Venice, etc." {...field} />
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
                          <Input placeholder="Same as departure if empty" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="boardingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boarding Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 4:00 PM" {...field} />
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
                
                <FormField
                  control={editForm.control}
                  name="portsOfCall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ports of Call (JSON format)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='["Naples, Italy", "Barcelona, Spain", "Marseille, France"]'
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
                <h3 className="text-lg font-medium">Ship Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
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
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
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
              
              {/* Cabin Types Management Section */}
              <div className="space-y-6 border-t pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Cabin Types</h3>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      onClick={() => {
                        addCabinTypeForm.reset({
                          name: "New Cabin Type",
                          description: "Description of cabin amenities",
                          price: 0,
                          capacity: 2,
                          image: "",
                          features: "[]",
                          featured: false,
                          availability: 10,
                          active: true
                        });
                        setEditingCabinType(null);
                      }}
                      variant="outline" 
                      size="sm"
                      disabled={!selectedCruise?.id}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Cabin Type
                    </Button>
                  </div>
                </div>
                
                {/* Add/Edit Cabin Type Form Section */}
                {!editingCabinType ? (
                  selectedCruise?.id ? (
                    <Card className="shadow-sm border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Add New Cabin Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...addCabinTypeForm}>
                          <form onSubmit={addCabinTypeForm.handleSubmit(onAddCabinTypeSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={addCabinTypeForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cabin Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Interior Stateroom" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={addCabinTypeForm.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price per Person</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center">
                                        <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">$</span>
                                        <Input type="number" className="rounded-l-none" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={addCabinTypeForm.control}
                                name="capacity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Occupancy</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={addCabinTypeForm.control}
                                name="availability"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Available Cabins</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={addCabinTypeForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea rows={3} placeholder="Describe the cabin amenities and features" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addCabinTypeForm.control}
                              name="features"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Features (JSON array)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder='["Private Balcony", "King Bed", "Mini-fridge", "Satellite TV"]' 
                                      rows={2} 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addCabinTypeForm.control}
                              name="image"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cabin Image</FormLabel>
                                  <FormControl>
                                    <ImageUpload 
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      folder="travelease/cruises/cabins"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-between pt-2">
                              <div className="flex gap-2">
                                <FormField
                                  control={addCabinTypeForm.control}
                                  name="featured"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">Featured</FormLabel>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={addCabinTypeForm.control}
                                  name="active"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">Active</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <Button type="submit" disabled={addCabinTypeMutation.isPending}>
                                {addCabinTypeMutation.isPending ? "Adding..." : "Add Cabin Type"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-4 border border-dashed rounded-md bg-muted/10">
                      <p className="text-sm text-muted-foreground">Save the cruise first to add cabin types</p>
                    </div>
                  )
                ) : (
                  <Card className="shadow-sm border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Edit Cabin Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...editCabinTypeForm}>
                        <form onSubmit={editCabinTypeForm.handleSubmit(onEditCabinTypeSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editCabinTypeForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cabin Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Interior Stateroom" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editCabinTypeForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price per Person</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center">
                                      <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">$</span>
                                      <Input type="number" className="rounded-l-none" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editCabinTypeForm.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Occupancy</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editCabinTypeForm.control}
                              name="availability"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available Cabins</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={editCabinTypeForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Describe the cabin amenities and features" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={editCabinTypeForm.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Features (JSON array)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder='["Private Balcony", "King Bed", "Mini-fridge", "Satellite TV"]' 
                                    rows={2} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={editCabinTypeForm.control}
                            name="image"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cabin Image</FormLabel>
                                <FormControl>
                                  <ImageUpload 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    folder="travelease/cruises/cabins"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-between pt-2">
                            <div className="flex gap-2">
                              <FormField
                                control={editCabinTypeForm.control}
                                name="featured"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">Featured</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={editCabinTypeForm.control}
                                name="active"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">Active</FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" onClick={() => setEditingCabinType(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateCabinTypeMutation.isPending}>
                                {updateCabinTypeMutation.isPending ? "Updating..." : "Save Changes"}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
                
                {/* List of Existing Cabin Types */}
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Existing Cabin Types</h4>
                  {cabinTypes.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/20">
                      <Bed className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No cabin types defined for this cruise</p>
                      <p className="text-xs text-muted-foreground mt-1">Add cabin types to display pricing and availability options</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cabinTypes.map((cabinType) => (
                        <Card key={cabinType.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            {cabinType.image && (
                              <div className="h-32 md:h-auto md:w-32 lg:w-48 overflow-hidden">
                                <img 
                                  src={cabinType.image} 
                                  alt={cabinType.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{cabinType.name}</h4>
                                  <Badge className="mt-1">{formatCurrency(cabinType.price)}</Badge>
                                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                    <span>Max Occupancy: {cabinType.capacity || 2}</span>
                                  </div>
                                </div>
                                <div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setEditingCabinType(cabinType)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete the ${cabinType.name} cabin type?`)) {
                                        deleteCabinTypeMutation.mutate(cabinType.id);
                                      }
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="mt-2 text-sm">{cabinType.description}</p>
                              {cabinType.features && (
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium mb-1">Features:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      try {
                                        const features = JSON.parse(cabinType.features);
                                        if (Array.isArray(features)) {
                                          return features.map((feature, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{feature}</Badge>
                                          ));
                                        }
                                        return null;
                                      } catch (e) {
                                        return null;
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
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
              Are you sure you want to delete {selectedCruise?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
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