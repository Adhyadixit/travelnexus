import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash, RefreshCw, Images, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectImageUpload } from "@/components/ui/direct-image-upload";
import { type HotelRoomType, type HotelRoomImage } from "@shared/schema";

interface RoomImagesManagerProps {
  hotelId: number;
}

export default function RoomImagesManager({ hotelId }: RoomImagesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [newRoomType, setNewRoomType] = useState({
    name: "",
    description: "",
    price: 0,
    capacity: 2,
    amenities: "",
  });
  const [newImage, setNewImage] = useState({
    imageUrl: "",
    caption: "",
    displayOrder: 0,
    featured: false,
  });
  const [isAddingRoomType, setIsAddingRoomType] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);

  // Fetch room types for this hotel
  const {
    data: roomTypes,
    isLoading: roomTypesLoading,
    error: roomTypesError,
  } = useQuery<HotelRoomType[]>({
    queryKey: [`/api/hotels/${hotelId}/room-types`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/hotels/${hotelId}/room-types`);
      return res.json();
    },
    enabled: !!hotelId,
  });

  // Fetch images for the selected room type
  const {
    data: roomImages,
    isLoading: roomImagesLoading,
    error: roomImagesError,
  } = useQuery<HotelRoomImage[]>({
    queryKey: [`/api/room-types/${selectedRoomType}/images`],
    enabled: !!selectedRoomType,
  });

  // Set the first room type as selected when data loads
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !selectedRoomType) {
      setSelectedRoomType(roomTypes[0].id);
    }
  }, [roomTypes, selectedRoomType]);
  
  // Safe access to roomTypes array with fallback to empty array for TypeScript
  const safeRoomTypes = roomTypes || [];

  // Create a new room type
  const createRoomTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/hotel-room-types`, {
        ...data,
        hotelId,
        amenities: JSON.stringify(data.amenities.split("\n").filter(Boolean)),
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${hotelId}/room-types`] });
      setIsAddingRoomType(false);
      setNewRoomType({
        name: "",
        description: "",
        price: 0,
        capacity: 2,
        amenities: "",
      });
      setSelectedRoomType(data.id);
      toast({
        title: "Room type created",
        description: "The room type has been created successfully.",
      });
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
      setSelectedRoomType(null);
      toast({
        title: "Room type deleted",
        description: "The room type has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete room type",
        description: error.message || "An error occurred while deleting the room type.",
        variant: "destructive",
      });
    },
  });

  // Add a new image to a room type
  const addImageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/room-types/${selectedRoomType}/images`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/room-types/${selectedRoomType}/images`] });
      setIsAddingImage(false);
      setNewImage({
        imageUrl: "",
        caption: "",
        displayOrder: 0,
        featured: false,
      });
      toast({
        title: "Image added",
        description: "The image has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add image",
        description: error.message || "An error occurred while adding the image.",
        variant: "destructive",
      });
    },
  });

  // Delete an image
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await apiRequest("DELETE", `/api/room-images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/room-types/${selectedRoomType}/images`] });
      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete image",
        description: error.message || "An error occurred while deleting the image.",
        variant: "destructive",
      });
    },
  });
  
  // Update an image to set it as featured
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, data }: { imageId: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/room-images/${imageId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/room-types/${selectedRoomType}/images`] });
      toast({
        title: "Image updated",
        description: "The image has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update image",
        description: error.message || "An error occurred while updating the image.",
        variant: "destructive",
      });
    },
  });

  // Safe access to roomImages array with fallback to empty array for TypeScript
  const safeRoomImages = roomImages || [];
  
  // Handle setting an image as featured
  const handleSetFeatured = (imageId: number, isFeatured: boolean) => {
    // If setting as featured, first clear all other featured images
    if (isFeatured) {
      safeRoomImages.forEach(image => {
        if (image.id !== imageId && image.featured) {
          updateImageMutation.mutate({ 
            imageId: image.id, 
            data: { ...image, featured: false } 
          });
        }
      });
    }
    
    // Update this image
    const image = safeRoomImages.find(img => img.id === imageId);
    if (image) {
      updateImageMutation.mutate({ 
        imageId, 
        data: { ...image, featured: isFeatured } 
      });
    }
  };

  // Handle submitting a new room type
  const handleAddRoomType = () => {
    createRoomTypeMutation.mutate(newRoomType);
  };

  // Handle submitting a new image
  const handleAddImage = () => {
    if (!selectedRoomType) return;
    
    addImageMutation.mutate({
      ...newImage,
      roomTypeId: selectedRoomType,
    });
  };

  // Show loading state if room types are loading
  if (roomTypesLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2">Loading room types...</span>
      </div>
    );
  }

  // Show error state if room types failed to load
  if (roomTypesError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load room types. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Room Types</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAddingRoomType(!isAddingRoomType)}
        >
          {isAddingRoomType ? (
            <>Cancel</>
          ) : (
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
                  onClick={handleAddRoomType}
                  disabled={createRoomTypeMutation.isPending || !newRoomType.name}
                >
                  {createRoomTypeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Room Type</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room type selector */}
      {!isAddingRoomType && safeRoomTypes.length > 0 ? (
        <div className="space-y-6">
          <div className="pb-4 border-b">
            <Select 
              value={selectedRoomType?.toString() || ""} 
              onValueChange={(value) => setSelectedRoomType(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {safeRoomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.id.toString()}>
                    {roomType.name} - ${roomType.price.toFixed(2)} per night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room details and images management */}
          {selectedRoomType && (
            <>
              <div className="space-y-6">
                {/* Room type details */}
                {safeRoomTypes.length > 0 && (
                  <div className="flex justify-between items-start">
                    <div>
                      {(() => {
                        const selectedRoom = safeRoomTypes.find(rt => rt.id === selectedRoomType);
                        return selectedRoom && (
                          <>
                            <h3 className="text-lg font-medium">
                              {selectedRoom.name}
                            </h3>
                            <p className="text-sm text-neutral-500">
                              ${selectedRoom.price.toFixed(2)} per night · 
                              Fits up to {selectedRoom.capacity} guests
                            </p>
                            <p className="mt-2 text-sm">
                              {selectedRoom.description}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
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
                            onClick={() => deleteRoomTypeMutation.mutate(selectedRoomType)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteRoomTypeMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Room images management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Room Images</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingImage(!isAddingImage)}
                    >
                      {isAddingImage ? (
                        <>Cancel</>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Add new image form */}
                  {isAddingImage && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Add New Image</CardTitle>
                        <CardDescription>Add an image for this room type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageUpload">Room Image</Label>
                            <DirectImageUpload
                              value={newImage.imageUrl}
                              onChange={(url) => setNewImage({...newImage, imageUrl: url})}
                              onUpload={(data) => setNewImage({...newImage, imageUrl: data.url})}
                              folder="travelease/room-images"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="caption">Image Caption (optional)</Label>
                              <Input 
                                id="caption"
                                placeholder="e.g., Room interior view"
                                value={newImage.caption}
                                onChange={(e) => setNewImage({...newImage, caption: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="displayOrder">Display Order</Label>
                              <Input 
                                id="displayOrder"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={newImage.displayOrder}
                                onChange={(e) => setNewImage({...newImage, displayOrder: parseInt(e.target.value)})}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="featured"
                              checked={newImage.featured}
                              onCheckedChange={(checked) => 
                                setNewImage({
                                  ...newImage, 
                                  featured: checked === true
                                })
                              }
                            />
                            <Label htmlFor="featured">Set as featured image</Label>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsAddingImage(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="button" 
                              onClick={handleAddImage}
                              disabled={addImageMutation.isPending || !newImage.imageUrl}
                            >
                              {addImageMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>Add Image</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Image gallery */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomImagesLoading ? (
                      <div className="col-span-full flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="ml-2">Loading images...</span>
                      </div>
                    ) : safeRoomImages.length > 0 ? (
                      safeRoomImages.map((image) => (
                        <Card key={image.id} className="overflow-hidden">
                          <div className="relative">
                            <img 
                              src={image.imageUrl} 
                              alt={image.caption || "Room image"} 
                              className="object-cover w-full h-48"
                            />
                            {image.featured && (
                              <Badge className="absolute top-2 right-2 bg-primary">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-3">
                            {image.caption && (
                              <p className="text-sm truncate">{image.caption}</p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={image.featured ? "text-neutral-500" : ""}
                                onClick={() => handleSetFeatured(image.id, !image.featured)}
                                disabled={updateImageMutation.isPending}
                              >
                                {image.featured ? "Unset Featured" : "Set as Featured"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive">
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this image.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteImageMutation.mutate(image.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleteImageMutation.isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col justify-center items-center h-32 border-2 border-dashed rounded-lg bg-neutral-50 text-neutral-500">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <p>No images yet. Add your first image!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : !isAddingRoomType && (
        <div className="flex flex-col justify-center items-center h-32 border-2 border-dashed rounded-lg bg-neutral-50 text-neutral-500">
          <Images className="w-8 h-8 mb-2" />
          <p>No room types yet. Add your first room type!</p>
        </div>
      )}
    </div>
  );
}