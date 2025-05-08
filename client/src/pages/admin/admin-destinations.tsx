import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import DestinationForm from "@/components/forms/destination-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Destination, insertDestinationSchema } from "@shared/schema";
import { z } from "zod";

type FormMode = "create" | "edit" | null;

export default function AdminDestinations() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);

  // Fetch destinations
  const {
    data: destinations,
    isLoading,
    error,
  } = useQuery<Destination[]>({
    queryKey: ["/api/destinations/admin"],
    enabled: true,
  });

  // Create destination mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertDestinationSchema>) => {
      const response = await apiRequest("POST", "/api/destinations/admin", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create destination");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Success",
        description: "Destination created successfully",
      });
      setFormMode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update destination mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof insertDestinationSchema>;
    }) => {
      const response = await apiRequest("PUT", `/api/destinations/admin/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update destination");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Success",
        description: "Destination updated successfully",
      });
      setFormMode(null);
      setSelectedDestination(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete destination mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/destinations/admin/${id}`);
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete destination");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Success",
        description: "Destination deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDestinationToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateDestination = (data: z.infer<typeof insertDestinationSchema>) => {
    createMutation.mutate(data);
  };

  const handleUpdateDestination = (data: z.infer<typeof insertDestinationSchema>) => {
    if (selectedDestination) {
      updateMutation.mutate({
        id: selectedDestination.id,
        data,
      });
    }
  };

  const handleDeleteDestination = () => {
    if (destinationToDelete) {
      deleteMutation.mutate(destinationToDelete.id);
    }
  };

  const handleEditDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setFormMode("edit");
  };

  const handleOpenDeleteDialog = (destination: Destination) => {
    setDestinationToDelete(destination);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
          <Button onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4 mr-2" /> Add Destination
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Failed to load destinations
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations?.map((destination) => (
              <div key={destination.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img
                    src={destination.imageUrl}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">{destination.name}</h2>
                      <p className="text-neutral-600">{destination.country}</p>
                    </div>
                    {destination.featured && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                    {destination.description}
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDestination(destination)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(destination)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={formMode !== null} onOpenChange={(open) => !open && setFormMode(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add New Destination" : "Edit Destination"}
            </DialogTitle>
          </DialogHeader>
          {formMode === "create" && (
            <DestinationForm
              onSubmit={handleCreateDestination}
              isSubmitting={createMutation.isPending}
            />
          )}
          {formMode === "edit" && selectedDestination && (
            <DestinationForm
              initialData={selectedDestination}
              onSubmit={handleUpdateDestination}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{destinationToDelete?.name}</span>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDestination}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}