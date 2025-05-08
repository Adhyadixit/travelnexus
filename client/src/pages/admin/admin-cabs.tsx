import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Cab, Destination } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import CabForm from "@/components/forms/cab-form";
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
  Car,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function AdminCabs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCab, setEditingCab] = useState<Cab | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/admin-auth");
    } else if (!user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch cabs
  const { data: cabs = [], isLoading: isLoadingCabs } = useQuery<Cab[]>({
    queryKey: ["/api/cabs"],
  });
  
  // Fetch destinations for dropdown
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Setup mutations
  const createCabMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/cabs", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cabs"] });
      setOpenDialog(false);
      toast({
        title: "Success",
        description: "Driver created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create driver",
        variant: "destructive",
      });
    },
  });
  
  const updateCabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/cabs/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cabs"] });
      setOpenDialog(false);
      setEditingCab(null);
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update driver",
        variant: "destructive",
      });
    },
  });
  
  const deleteCabMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/cabs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cabs"] });
      toast({
        title: "Success",
        description: "Driver deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete driver",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingCab) {
        await updateCabMutation.mutateAsync({ id: editingCab.id, data });
      } else {
        await createCabMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Parse languages from JSON
  const formatLanguages = (languages: any) => {
    if (!languages) return "None";
    try {
      if (Array.isArray(languages)) {
        return languages.join(", ");
      }
      return String(languages);
    } catch (e) {
      return "Unknown";
    }
  };
  
  // Define columns for the data table
  const columns: ColumnDef<Cab>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "driverName",
      header: "Driver",
      cell: ({ row }) => {
        const cab = row.original;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={cab.profileImageUrl} alt={cab.driverName} />
              <AvatarFallback>{cab.driverName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-medium">{cab.driverName}</div>
          </div>
        );
      },
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
      accessorKey: "vehicleModel",
      header: "Vehicle",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>{row.getValue("vehicleModel")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "languages",
      header: "Languages",
      cell: ({ row }) => formatLanguages(row.getValue("languages")),
    },
    {
      accessorKey: "dailyRate",
      header: "Daily Rate",
      cell: ({ row }) => <div className="font-medium">${(row.getValue("dailyRate") as number).toLocaleString()}</div>,
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number | undefined;
        
        return rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-secondary fill-current" />
            <span>{rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No rating</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cab = row.original;
        
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
                  setEditingCab(cab);
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
                      This will permanently delete the driver. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCabMutation.mutate(cab.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteCabMutation.isPending ? (
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
        <title>Manage Drivers | Admin Dashboard</title>
        <meta name="description" content="Administrative interface for managing drivers and cab services on TravelEase platform." />
        <meta property="og:title" content="Manage Drivers | TravelEase Admin" />
        <meta property="og:description" content="Create, edit and delete private drivers in the TravelEase administration system." />
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Drivers</h1>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCab ? "Edit Driver" : "Create Driver"}</DialogTitle>
                <DialogDescription>
                  {editingCab 
                    ? "Update the details of the existing driver." 
                    : "Fill in the details to create a new driver."}
                </DialogDescription>
              </DialogHeader>
              
              <CabForm
                initialData={editingCab || undefined}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoadingCabs ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            data={cabs}
            searchColumn="driverName"
            searchPlaceholder="Search drivers..."
          />
        )}
      </div>
    </div>
  );
}
