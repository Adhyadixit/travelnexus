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
  
  // New states for cabin type management
  const [cabinTypes, setCabinTypes] = useState<CruiseCabinType[]>([]);
  const [isAddCabinTypeOpen, setIsAddCabinTypeOpen] = useState(false);
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
      maxOccupancy: 1,
      imageUrl: "",
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
      maxOccupancy: 1,
      imageUrl: "",
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
        maxOccupancy: editingCabinType.maxOccupancy || 2,
        imageUrl: editingCabinType.imageUrl || "",
        features: editingCabinType.features || "[]"
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
      setIsAddCabinTypeOpen(false);
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
    mutationFn: async (cabinType: CruiseCabinType) => {
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
    try {
      await updateCabinTypeMutation.mutateAsync(data);
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
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Images</h3>
                    <FormField
                      control={createForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              folder="travelease/cruises"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Image Gallery</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentValue = createForm.getValues("imageGallery");
                            try {
                              const currentGallery = currentValue ? JSON.parse(currentValue) : [];
                              const newGallery = [...currentGallery, ""];
                              createForm.setValue("imageGallery", JSON.stringify(newGallery));
                            } catch (error) {
                              // If JSON parsing fails, start a new array
                              createForm.setValue("imageGallery", JSON.stringify([""]));
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Image
                        </Button>
                      </div>
                      
                      <FormField
                        control={createForm.control}
                        name="imageGallery"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-4">
                                {(() => {
                                  let galleryImages: string[] = [];
                                  try {
                                    galleryImages = field.value ? JSON.parse(field.value) : [];
                                  } catch (error) {
                                    // If parsing fails, use empty array
                                  }
                                  
                                  return galleryImages.map((url, index) => (
                                    <div key={index} className="relative border rounded-md p-4">
                                      <div className="absolute top-2 right-2">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => {
                                            const newGallery = [...galleryImages];
                                            newGallery.splice(index, 1);
                                            field.onChange(JSON.stringify(newGallery));
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      
                                      <div className="mt-6">
                                        <ImageUpload
                                          value={url}
                                          onChange={(newUrl) => {
                                            const newGallery = [...galleryImages];
                                            newGallery[index] = newUrl;
                                            field.onChange(JSON.stringify(newGallery));
                                          }}
                                          folder="travelease/cruises/gallery"
                                        />
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Add multiple images to showcase different aspects of the cruise
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t">
                    <FormField
                      control={createForm.control}
                      name="cabinTypes"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Cabin Types</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentValue = field.value || "[]";
                                try {
                                  const currentCabins = JSON.parse(currentValue);
                                  const newCabins = [...currentCabins, {
                                    type: "New Cabin Type",
                                    price: 0,
                                    description: "Description of cabin amenities",
                                    imageUrl: ""
                                  }];
                                  field.onChange(JSON.stringify(newCabins));
                                } catch (error) {
                                  // If JSON parsing fails, start a new array
                                  field.onChange(JSON.stringify([{
                                    type: "Interior",
                                    price: 799,
                                    description: "Cozy interior cabin",
                                    imageUrl: ""
                                  }]));
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Cabin Type
                            </Button>
                          </div>
                          <FormControl>
                            <div className="space-y-4 mt-4">
                              {(() => {
                                let cabins: Array<{
                                  type: string;
                                  price: number;
                                  description: string;
                                  imageUrl: string;
                                }> = [];
                                
                                try {
                                  cabins = field.value ? JSON.parse(field.value) : [];
                                  // If it's just a simple object, convert it to array format
                                  if (!Array.isArray(cabins)) {
                                    const newCabins = [];
                                    for (const [type, price] of Object.entries(cabins)) {
                                      newCabins.push({
                                        type,
                                        price: parseFloat(String(price).replace(/[^0-9.]/g, '')),
                                        description: `${type} cabin`,
                                        imageUrl: ""
                                      });
                                    }
                                    cabins = newCabins;
                                    field.onChange(JSON.stringify(newCabins)); 
                                  }
                                } catch (error) {
                                  // If parsing fails, use empty array
                                  cabins = [];
                                }
                                
                                return cabins.map((cabin, index) => (
                                  <Card key={index} className="relative">
                                    <CardHeader className="pb-2">
                                      <div className="absolute top-2 right-2">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => {
                                            const newCabins = [...cabins];
                                            newCabins.splice(index, 1);
                                            field.onChange(JSON.stringify(newCabins));
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <CardTitle className="text-md">
                                        <Input 
                                          value={cabin.type} 
                                          onChange={(e) => {
                                            const newCabins = [...cabins];
                                            newCabins[index] = {
                                              ...newCabins[index],
                                              type: e.target.value
                                            };
                                            field.onChange(JSON.stringify(newCabins));
                                          }}
                                          placeholder="Cabin Type"
                                          className="font-semibold text-base"
                                        />
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <FormLabel className="text-sm">Price (USD)</FormLabel>
                                        <div className="flex mt-1">
                                          <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                                            $
                                          </span>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={cabin.price}
                                            onChange={(e) => {
                                              const newCabins = [...cabins];
                                              newCabins[index] = {
                                                ...newCabins[index],
                                                price: parseFloat(e.target.value) || 0
                                              };
                                              field.onChange(JSON.stringify(newCabins));
                                            }}
                                            className="rounded-l-none"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <FormLabel className="text-sm">Description</FormLabel>
                                        <Textarea
                                          value={cabin.description}
                                          onChange={(e) => {
                                            const newCabins = [...cabins];
                                            newCabins[index] = {
                                              ...newCabins[index],
                                              description: e.target.value
                                            };
                                            field.onChange(JSON.stringify(newCabins));
                                          }}
                                          placeholder="Describe cabin amenities and features"
                                          className="mt-1"
                                          rows={3}
                                        />
                                      </div>
                                      
                                      <div>
                                        <FormLabel className="text-sm">Cabin Image</FormLabel>
                                        <div className="mt-1">
                                          <ImageUpload
                                            value={cabin.imageUrl}
                                            onChange={(url) => {
                                              const newCabins = [...cabins];
                                              newCabins[index] = {
                                                ...newCabins[index],
                                                imageUrl: url
                                              };
                                              field.onChange(JSON.stringify(newCabins));
                                            }}
                                            folder="travelease/cruises/cabins"
                                          />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ));
                              })()}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Add different cabin types with prices and details
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                      control={createForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price ($)</FormLabel>
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
                      <FormLabel>Main Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          folder="travelease/cruises"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Image Gallery</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentValue = editForm.getValues("imageGallery");
                        try {
                          const currentGallery = currentValue ? JSON.parse(currentValue) : [];
                          const newGallery = [...currentGallery, ""];
                          editForm.setValue("imageGallery", JSON.stringify(newGallery));
                        } catch (error) {
                          // If JSON parsing fails, start a new array
                          editForm.setValue("imageGallery", JSON.stringify([""]));
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="imageGallery"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            {(() => {
                              let galleryImages: string[] = [];
                              try {
                                galleryImages = field.value ? JSON.parse(field.value) : [];
                              } catch (error) {
                                // If parsing fails, use empty array
                              }
                              
                              return galleryImages.map((url, index) => (
                                <div key={index} className="relative border rounded-md p-4">
                                  <div className="absolute top-2 right-2">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => {
                                        const newGallery = [...galleryImages];
                                        newGallery.splice(index, 1);
                                        field.onChange(JSON.stringify(newGallery));
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="mt-6">
                                    <ImageUpload
                                      value={url}
                                      onChange={(newUrl) => {
                                        const newGallery = [...galleryImages];
                                        newGallery[index] = newUrl;
                                        field.onChange(JSON.stringify(newGallery));
                                      }}
                                      folder="travelease/cruises/gallery"
                                    />
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Add multiple images to showcase different aspects of the cruise
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                      <FormItem className="col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Cabin Types</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue = field.value || "[]";
                              try {
                                const currentCabins = JSON.parse(currentValue);
                                const newCabins = [...currentCabins, {
                                  type: "New Cabin Type",
                                  price: 0,
                                  description: "Description of cabin amenities",
                                  imageUrl: ""
                                }];
                                field.onChange(JSON.stringify(newCabins));
                              } catch (error) {
                                // If JSON parsing fails, start a new array
                                field.onChange(JSON.stringify([{
                                  type: "Interior",
                                  price: 799,
                                  description: "Cozy interior cabin",
                                  imageUrl: ""
                                }]));
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Cabin Type
                          </Button>
                        </div>
                        <FormControl>
                          <div className="space-y-4 mt-4">
                            {(() => {
                              let cabins: Array<{
                                type: string;
                                price: number;
                                description: string;
                                imageUrl: string;
                              }> = [];
                              
                              try {
                                cabins = field.value ? JSON.parse(field.value) : [];
                                // If it's just a simple object, convert it to array format
                                if (!Array.isArray(cabins)) {
                                  const newCabins = [];
                                  for (const [type, price] of Object.entries(cabins)) {
                                    newCabins.push({
                                      type,
                                      price: parseFloat(String(price).replace(/[^0-9.]/g, '')),
                                      description: `${type} cabin`,
                                      imageUrl: ""
                                    });
                                  }
                                  cabins = newCabins;
                                  field.onChange(JSON.stringify(newCabins)); 
                                }
                              } catch (error) {
                                // If parsing fails, use empty array
                                cabins = [];
                              }
                              
                              return cabins.map((cabin, index) => (
                                <Card key={index} className="relative">
                                  <CardHeader className="pb-2">
                                    <div className="absolute top-2 right-2">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => {
                                          const newCabins = [...cabins];
                                          newCabins.splice(index, 1);
                                          field.onChange(JSON.stringify(newCabins));
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <CardTitle className="text-md">
                                      <Input 
                                        value={cabin.type} 
                                        onChange={(e) => {
                                          const newCabins = [...cabins];
                                          newCabins[index] = {
                                            ...newCabins[index],
                                            type: e.target.value
                                          };
                                          field.onChange(JSON.stringify(newCabins));
                                        }}
                                        placeholder="Cabin Type"
                                        className="font-semibold text-base"
                                      />
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <FormLabel className="text-sm">Price (USD)</FormLabel>
                                      <div className="flex mt-1">
                                        <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                                          $
                                        </span>
                                        <Input 
                                          type="number" 
                                          value={cabin.price} 
                                          onChange={(e) => {
                                            const newCabins = [...cabins];
                                            newCabins[index] = {
                                              ...newCabins[index],
                                              price: parseFloat(e.target.value) || 0
                                            };
                                            field.onChange(JSON.stringify(newCabins));
                                          }}
                                          className="rounded-l-none"
                                          placeholder="Price"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <FormLabel className="text-sm">Description</FormLabel>
                                      <Textarea 
                                        value={cabin.description || ""} 
                                        onChange={(e) => {
                                          const newCabins = [...cabins];
                                          newCabins[index] = {
                                            ...newCabins[index],
                                            description: e.target.value
                                          };
                                          field.onChange(JSON.stringify(newCabins));
                                        }}
                                        placeholder="Describe cabin amenities and features"
                                        rows={2}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <FormLabel className="text-sm">Cabin Image</FormLabel>
                                      <div className="mt-1">
                                        <ImageUpload
                                          value={cabin.imageUrl || ""}
                                          onChange={(url) => {
                                            const newCabins = [...cabins];
                                            newCabins[index] = {
                                              ...newCabins[index],
                                              imageUrl: url
                                            };
                                            field.onChange(JSON.stringify(newCabins));
                                          }}
                                          folder="travelease/cruises/cabins"
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ));
                            })()}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Add different cabin types with pricing and images
                        </FormDescription>
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
              
              {/* Cabin Types Management Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Cabin Types</h3>
                  <Button 
                    type="button" 
                    onClick={() => setIsAddCabinTypeOpen(true)} 
                    variant="outline" 
                    size="sm"
                    disabled={!selectedCruise?.id}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Cabin Type
                  </Button>
                </div>
                
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
                          {cabinType.imageUrl && (
                            <div className="h-32 md:h-auto md:w-32 lg:w-48 overflow-hidden">
                              <img 
                                src={cabinType.imageUrl} 
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
                                  <span>Max Occupancy: {cabinType.maxOccupancy}</span>
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
                                  {JSON.parse(cabinType.features || '[]').map((feature: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">{feature}</Badge>
                                  ))}
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

      {/* Add Cabin Type Dialog */}
      <Dialog open={isAddCabinTypeOpen} onOpenChange={setIsAddCabinTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Cabin Type</DialogTitle>
            <DialogDescription>
              Create a new cabin type for {selectedCruise?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addCabinTypeForm}>
            <form onSubmit={addCabinTypeForm.handleSubmit(onAddCabinTypeSubmit)} className="space-y-6">
              <FormField
                control={addCabinTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabin Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, Balcony, Interior, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addCabinTypeForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addCabinTypeForm.control}
                  name="maxOccupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Occupancy</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} />
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
                      <Textarea rows={3} placeholder="Describe cabin amenities and features" {...field} />
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
                    <FormLabel>Features (comma-separated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Balcony, Mini-bar, Ocean view, etc."
                        value={field.value === '[]' ? '' : JSON.parse(field.value).join(', ')}
                        onChange={(e) => {
                          const featuresArray = e.target.value
                            ? e.target.value.split(',').map(feature => feature.trim())
                            : [];
                          field.onChange(JSON.stringify(featuresArray));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter features separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addCabinTypeForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabin Image</FormLabel>
                    <FormControl>
                      <ImageUpload 
                        value={field.value || ''}
                        onChange={field.onChange}
                        onRemove={() => field.onChange('')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCabinTypeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addCabinTypeMutation.isPending}>
                  {addCabinTypeMutation.isPending ? "Adding..." : "Add Cabin Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Cabin Type Dialog */}
      <Dialog open={!!editingCabinType} onOpenChange={(open) => !open && setEditingCabinType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cabin Type</DialogTitle>
            <DialogDescription>
              Update cabin type details for {selectedCruise?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editCabinTypeForm}>
            <form onSubmit={editCabinTypeForm.handleSubmit(onEditCabinTypeSubmit)} className="space-y-6">
              <FormField
                control={editCabinTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabin Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, Balcony, Interior, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editCabinTypeForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editCabinTypeForm.control}
                  name="maxOccupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Occupancy</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} />
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
                      <Textarea rows={3} placeholder="Describe cabin amenities and features" {...field} />
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
                    <FormLabel>Features (comma-separated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Balcony, Mini-bar, Ocean view, etc."
                        value={field.value === '[]' ? '' : JSON.parse(field.value).join(', ')}
                        onChange={(e) => {
                          const featuresArray = e.target.value
                            ? e.target.value.split(',').map(feature => feature.trim())
                            : [];
                          field.onChange(JSON.stringify(featuresArray));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter features separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCabinTypeForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabin Image</FormLabel>
                    <FormControl>
                      <ImageUpload 
                        value={field.value || ''}
                        onChange={field.onChange}
                        onRemove={() => field.onChange('')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCabinType(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCabinTypeMutation.isPending}>
                  {updateCabinTypeMutation.isPending ? "Updating..." : "Update Cabin Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}