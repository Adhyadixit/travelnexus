import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Destination } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import PackageForm from "@/components/forms/package-form";
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
import { 
  ColumnDef, 
  ColumnFiltersState, 
  SortingState, 
  flexRender, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  useReactTable
} from "@tanstack/react-table";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Star, 
  MapPin,
  Calendar,
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

export default function AdminPackages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/admin-auth");
    } else if (!user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch packages
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });
  
  // Fetch destinations for dropdown
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });
  
  // Setup mutations
  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/packages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setOpenDialog(false);
      toast({
        title: "Success",
        description: "Package created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create package",
        variant: "destructive",
      });
    },
  });
  
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/packages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setOpenDialog(false);
      setEditingPackage(null);
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update package",
        variant: "destructive",
      });
    },
  });
  
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete package",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await updatePackageMutation.mutateAsync({ id: editingPackage.id, data });
      } else {
        await createPackageMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingPackage(null);
  };
  
  // Define columns for the data table
  const columns: ColumnDef<Package>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Package Name",
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
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("duration") as number;
        
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{duration} {duration === 1 ? "day" : "days"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div className="font-medium">${(row.getValue("price") as number).toLocaleString()}</div>,
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        return (
          <Badge className={status === "active" ? "bg-success" : "bg-neutral-500"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const pkg = row.original;
        
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
                  setEditingPackage(pkg);
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
                      This will permanently delete the package. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deletePackageMutation.mutate(pkg.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletePackageMutation.isPending ? (
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
        <title>Manage Packages | Admin Dashboard</title>
        <meta name="description" content="Administrative interface for managing travel packages on TravelEase platform." />
        <meta property="og:title" content="Manage Packages | TravelEase Admin" />
        <meta property="og:description" content="Create, edit and delete travel packages in the TravelEase administration system." />
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Packages</h1>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit Package" : "Create Package"}</DialogTitle>
                <DialogDescription>
                  {editingPackage 
                    ? "Update the details of the existing package." 
                    : "Fill in the details to create a new travel package."}
                </DialogDescription>
              </DialogHeader>
              
              <PackageForm
                initialData={editingPackage || undefined}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoadingPackages ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            data={packages}
            searchColumn="name"
            searchPlaceholder="Search packages..."
          />
        )}
      </div>
    </div>
  );
}
