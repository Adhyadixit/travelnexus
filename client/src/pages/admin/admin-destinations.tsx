import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import DestinationForm from "@/components/forms/destination-form";
import { type Destination } from "@shared/schema";

export default function AdminDestinations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Fetch all destinations
  const {
    data: destinations,
    isLoading: isLoadingDestinations,
    error: destinationsError,
  } = useQuery<Destination[]>({
    queryKey: ["/api/destinations/admin"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/destinations/admin");
      return res.json();
    },
    enabled: !!user,
  });

  // Create a new destination
  const createDestinationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/destinations/admin", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      setIsFormOpen(false);
      toast({
        title: "Destination created",
        description: "The destination has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create destination",
        description: error.message || "An error occurred while creating the destination.",
        variant: "destructive",
      });
    },
  });

  // Update an existing destination
  const updateDestinationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/destinations/admin/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      setIsFormOpen(false);
      setSelectedDestination(null);
      toast({
        title: "Destination updated",
        description: "The destination has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update destination",
        description: error.message || "An error occurred while updating the destination.",
        variant: "destructive",
      });
    },
  });

  // Delete a destination
  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/destinations/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Destination deleted",
        description: "The destination has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete destination",
        description: error.message || "An error occurred while deleting the destination.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDestination = (data: any) => {
    createDestinationMutation.mutate(data);
  };

  const handleUpdateDestination = (data: any) => {
    if (selectedDestination) {
      updateDestinationMutation.mutate({
        id: selectedDestination.id,
        data,
      });
    }
  };

  const handleEditDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedDestination(null);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Destinations</h1>
          <p className="text-neutral-500">
            Manage travel destinations available on the platform
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Destination
        </Button>
      </div>

      <Separator className="my-6" />

      {isLoadingDestinations ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : destinationsError ? (
        <div className="text-destructive">
          Error loading destinations. Please try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations?.map((destination) => (
            <Card key={destination.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={destination.imageUrl}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
                {destination.featured && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    Featured
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex justify-between items-center">
                  {destination.name}
                </CardTitle>
                <CardDescription>{destination.country}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm line-clamp-2">{destination.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditDestination(destination)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the destination "{destination.name}".
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteDestinationMutation.mutate(destination.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteDestinationMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDestination ? "Edit Destination" : "Add New Destination"}
            </DialogTitle>
            <DialogDescription>
              {selectedDestination
                ? "Update the details of this destination"
                : "Fill in the details to create a new destination"}
            </DialogDescription>
          </DialogHeader>
          <DestinationForm
            initialData={selectedDestination || undefined}
            onSubmit={
              selectedDestination
                ? handleUpdateDestination
                : handleCreateDestination
            }
            isSubmitting={
              createDestinationMutation.isPending ||
              updateDestinationMutation.isPending
            }
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}