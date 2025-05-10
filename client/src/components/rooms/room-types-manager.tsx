import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HotelRoomType, InsertHotelRoomType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash } from "lucide-react";
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

interface RoomTypesManagerProps {
  hotelId: number;
}

export function RoomTypesManager({ hotelId }: RoomTypesManagerProps) {
  const { toast } = useToast();
  const [isAddingRoomType, setIsAddingRoomType] = useState(false);
  const [newRoomType, setNewRoomType] = useState({
    name: "",
    description: "",
    price: 0,
    capacity: 2,
    amenities: "",
  });

  // Fetch room types for this hotel
  const {
    data: roomTypes,
    isLoading: roomTypesLoading,
    error: roomTypesError,
    refetch: refetchRoomTypes
  } = useQuery<HotelRoomType[]>({
    queryKey: [`/api/hotels/${hotelId}/room-types`],
    enabled: !!hotelId,
  });

  // Create a new room type
  const createRoomTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/hotels/${hotelId}/room-types`, {
        ...data,
        hotelId,
        amenities: JSON.stringify(data.amenities.split("\n").filter(Boolean)),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/room-types`] });
      setIsAddingRoomType(false);
      setNewRoomType({
        name: "",
        description: "",
        price: 0,
        capacity: 2,
        amenities: "",
      });
      toast({
        title: "Room type created",
        description: "The room type has been created successfully.",
      });
      refetchRoomTypes();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create room type",
        description: error.message || "An error occurred while creating the room type.",
        variant: "destructive",
      });
    },
  });

  // Delete a room type
  const deleteRoomTypeMutation = useMutation({
    mutationFn: async (roomTypeId: number) => {
      await apiRequest("DELETE", `/api/room-types/${roomTypeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/room-types`] });
      toast({
        title: "Room type deleted",
        description: "The room type has been deleted successfully.",
      });
      refetchRoomTypes();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete room type",
        description: error.message || "An error occurred while deleting the room type.",
        variant: "destructive",
      });
    },
  });

  // Handle submitting a new room type
  const handleAddRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    createRoomTypeMutation.mutate(newRoomType);
  };

  // Safe access to roomTypes array with fallback to empty array
  const safeRoomTypes = roomTypes || [];

  // Show loading state if data is loading
  if (roomTypesLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2">Loading room types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Room Types</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAddingRoomType(!isAddingRoomType)}
        >
          {isAddingRoomType ? "Cancel" : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Room Type
            </>
          )}
        </Button>
      </div>

      {/* Add new room type form */}
      {isAddingRoomType && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Room Type</CardTitle>
            <CardDescription>Create a new room type for this hotel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Type Name</Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Deluxe Room"
                    value={newRoomType.name}
                    onChange={(e) => setNewRoomType({...newRoomType, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (per night)</Label>
                    <Input 
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newRoomType.price}
                      onChange={(e) => setNewRoomType({...newRoomType, price: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (guests)</Label>
                    <Input 
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={newRoomType.capacity}
                      onChange={(e) => setNewRoomType({...newRoomType, capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe the room type..."
                  value={newRoomType.description}
                  onChange={(e) => setNewRoomType({...newRoomType, description: e.target.value})}
                  className="min-h-[80px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (one per line)</Label>
                <Textarea 
                  id="amenities"
                  placeholder="TV&#10;Air conditioning&#10;Mini-bar&#10;Safe"
                  value={newRoomType.amenities}
                  onChange={(e) => setNewRoomType({...newRoomType, amenities: e.target.value})}
                  className="min-h-[80px]"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingRoomType(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => handleAddRoomType(e)}
                  disabled={createRoomTypeMutation.isPending}
                >
                  {createRoomTypeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Room Type"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room type list */}
      {!isAddingRoomType && (
        <div className="space-y-4">
          {safeRoomTypes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No room types added yet. Click "Add Room Type" to create your first room type.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeRoomTypes.map((roomType) => (
                <Card key={roomType.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{roomType.name}</CardTitle>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this room type and all its images.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRoomTypeMutation.mutate(roomType.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteRoomTypeMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <CardDescription>
                      ${roomType.price.toFixed(2)} per night · Fits up to {roomType.capacity} guests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{roomType.description}</p>
                    {roomType.amenities && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Amenities:</p>
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(roomType.amenities).map((amenity: string, index: number) => (
                            <span key={index} className="text-xs bg-muted px-2 py-1 rounded-full">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RoomTypesManager;