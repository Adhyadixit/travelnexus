import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Hotel, Destination } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import HotelForm from "@/components/forms/hotel-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash,
  Star,
  MapPin,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from 'react-helmet';

export default function AdminHotels() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/admin-auth");
    } else if (!user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch hotels
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });
  
  // Fetch destinations for dropdown
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Setup mutations
  const createHotelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/hotels", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      setOpenDialog(false);
      toast({
        title: "Success",
        description: "Hotel created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create hotel",
        variant: "destructive",
      });
    },
  });
  
  const updateHotelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/hotels/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      setOpenDialog(false);
      setEditingHotel(null);
      toast({
        title: "Success",
        description: "Hotel updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hotel",
        variant: "destructive",
      });
    },
  });
  
  const deleteHotelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/hotels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      toast({
        title: "Success",
        description: "Hotel deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete hotel",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingHotel) {
        await updateHotelMutation.mutateAsync({ id: editingHotel.id, data });
      } else {
        await createHotelMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Define columns for the data table
  const columns: ColumnDef<Hotel>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Hotel Name",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "destinationId",
      header: "Destination",
      cell: ({ row }) => {
        const destinationId = row.getValue("destinationId") as number;
        const destination = destinations.find(d => d.id === destinationId);
        
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{destination?.name || "Unknown"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "rating",
      header: "Stars",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        const stars = [];
        
        for (let i = 0; i < rating; i++) {
          stars.push(<Star key={i} className="h-4 w-4 text-secondary fill-current" />);
        }
        
        return <div className="flex">{stars}</div>;
      },
    },
    {
      accessorKey: "pricePerNight",
      header: "Price / Night",
      cell: ({ row }) => <div className="font-medium">${(row.getValue("pricePerNight") as number).toLocaleString()}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const hotel = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditingHotel(hotel);
                  setOpenDialog(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the hotel. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteHotelMutation.mutate(hotel.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteHotelMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Helmet>
        <title>Manage Hotels | Admin Dashboard</title>
        <meta name="description" content="Administrative interface for managing hotels on TravelEase platform." />
        <meta property="og:title" content="Manage Hotels | TravelEase Admin" />
        <meta property="og:description" content="Create, edit and delete hotels in the TravelEase administration system." />
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Hotels</h1>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingHotel ? "Edit Hotel" : "Create Hotel"}</DialogTitle>
                <DialogDescription>
                  {editingHotel 
                    ? "Update the details of the existing hotel." 
                    : "Fill in the details to create a new hotel."}
                </DialogDescription>
              </DialogHeader>
              
              <HotelForm
                initialData={editingHotel || undefined}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoadingHotels ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            data={hotels}
            searchColumn="name"
            searchPlaceholder="Search hotels..."
          />
        )}
      </div>
    </div>
  );
}
