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
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

type CruiseFormValues = z.infer<typeof cruiseFormSchema>;

export default function AdminCruises() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCruise, setSelectedCruise] = useState<Cruise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all cruises
  const { 
    data: cruises = [],
    isLoading
  } = useQuery<Cruise[]>({
    queryKey: ["/api/cruises/admin"],
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
    resolver: zodResolver(cruiseFormSchema.extend({ id: z.number() })),
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
    editForm.reset({
      id: cruise.id,
      name: cruise.name,
      description: cruise.description,
      imageUrl: cruise.imageUrl,
      price: cruise.price,
      duration: cruise.duration,
      capacity: cruise.capacity,
      itinerary: cruise.itinerary,
      available: cruise.available,
      featured: cruise.featured,
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
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Cruise
                  </Button>
                </DialogTrigger>
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
                        <TableCell>{cruise.capacity} passengers</TableCell>
                        <TableCell>{formatCurrency(cruise.price)}</TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                            cruise.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {cruise.available ? "Available" : "Unavailable"}
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
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
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
                control={editForm.control}
                name="itinerary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Itinerary (JSON format)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
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