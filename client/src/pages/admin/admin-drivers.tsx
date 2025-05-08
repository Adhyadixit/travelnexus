import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, TrashIcon, Search } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";

// Driver type from schema
type Driver = {
  id: number;
  name: string;
  photoUrl: string;
  carModel: string;
  carYear: number;
  licensePlate: string;
  rating: number;
  pricePerDay: number;
  phone: string;
  email: string;
  description: string;
  destinationId: number;
  availability: string;
};

type Destination = {
  id: number;
  name: string;
  country: string;
};

// Driver form schema using zod
const driverFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  photoUrl: z.string().url({ message: "Please enter a valid URL" }),
  carModel: z.string().min(2, { message: "Car model must be at least 2 characters" }),
  carYear: z.coerce.number().int().min(1990, { message: "Car year must be 1990 or later" }),
  licensePlate: z.string().min(3, { message: "License plate must be at least 3 characters" }),
  rating: z.coerce.number().min(1).max(5),
  pricePerDay: z.coerce.number().min(10, { message: "Price must be at least 10" }),
  phone: z.string().min(8, { message: "Phone must be at least 8 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  destinationId: z.coerce.number(),
  availability: z.string(),
});

export default function AdminDrivers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use direct database access to fetch drivers
  const {
    data: drivers = [],
    isLoading: driversLoading,
    error: driversError,
  } = useQuery<Driver[]>({
    queryKey: ["/api/direct/drivers"],
  });

  // Fetch destinations for dropdown
  const {
    data: destinations = [],
    isLoading: destinationsLoading,
  } = useQuery<Destination[]>({
    queryKey: ["/api/direct/destinations"],
  });

  // Driver form using react-hook-form
  const form = useForm<z.infer<typeof driverFormSchema>>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      photoUrl: "",
      carModel: "",
      carYear: 2020,
      licensePlate: "",
      rating: 4.5,
      pricePerDay: 50,
      phone: "",
      email: "",
      description: "",
      destinationId: 0,
      availability: "available",
    },
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: z.infer<typeof driverFormSchema>) => {
      const response = await apiRequest("POST", "/api/drivers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/drivers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Driver created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create driver: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof driverFormSchema>;
    }) => {
      const response = await apiRequest("PATCH", `/api/drivers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/drivers"] });
      setIsDialogOpen(false);
      setSelectedDriver(null);
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update driver: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/drivers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/drivers"] });
      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
      toast({
        title: "Success",
        description: "Driver deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete driver: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setSelectedDriver(driver);
      form.reset({
        name: driver.name || "",
        photoUrl: driver.photoUrl || "",
        carModel: driver.carModel || "",
        carYear: driver.carYear || 2020,
        licensePlate: driver.licensePlate || "",
        rating: driver.rating || 4.5,
        pricePerDay: driver.pricePerDay || 50,
        phone: driver.phone || "",
        email: driver.email || "",
        description: driver.description || "",
        destinationId: driver.destinationId || (destinations.length > 0 ? destinations[0].id : 0),
        availability: driver.availability || "available",
      });
    } else {
      setSelectedDriver(null);
      form.reset({
        name: "",
        photoUrl: "",
        carModel: "",
        carYear: 2020,
        licensePlate: "",
        rating: 4.5,
        pricePerDay: 50,
        phone: "",
        email: "",
        description: "",
        destinationId: destinations.length > 0 ? destinations[0].id : 0,
        availability: "available",
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof driverFormSchema>) => {
    if (selectedDriver) {
      updateDriverMutation.mutate({
        id: selectedDriver.id,
        data,
      });
    } else {
      createDriverMutation.mutate(data);
    }
  };

  // Filter drivers based on search query
  const filteredDrivers = searchQuery
    ? drivers.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : drivers;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add New Driver
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search drivers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>All Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : driversError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load drivers
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No drivers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img
                                  src={driver.photoUrl}
                                  alt={driver.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{driver.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {driver.rating} ★
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{driver.carModel} ({driver.carYear})</div>
                            <div className="text-sm text-muted-foreground">{driver.licensePlate}</div>
                          </TableCell>
                          <TableCell>
                            <div>{driver.phone}</div>
                            <div className="text-sm text-muted-foreground">{driver.email}</div>
                          </TableCell>
                          <TableCell>
                            {destinations.find((d) => d.id === driver.destinationId)?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            ${driver.pricePerDay}/day
                          </TableCell>
                          <TableCell>
                            <Badge variant={(driver.availability && driver.availability === "available") ? "default" : "secondary"}>
                              {driver.availability ? driver.availability.charAt(0).toUpperCase() + driver.availability.slice(1) : "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(driver)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDeleteDialog(driver)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDriver ? "Edit Driver" : "Add New Driver"}
            </DialogTitle>
            <DialogDescription>
              {selectedDriver
                ? "Update driver details below"
                : "Fill out the form to create a new driver"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Model</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="1" max="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Day</FormLabel>
                      <FormControl>
                        <Input type="number" min="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {destinationsLoading ? (
                            <div className="flex justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : (
                            destinations.map((destination) => (
                              <SelectItem
                                key={destination.id}
                                value={destination.id.toString()}
                              >
                                {destination.name}, {destination.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createDriverMutation.isPending || updateDriverMutation.isPending
                  }
                >
                  {(createDriverMutation.isPending || updateDriverMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedDriver ? "Update Driver" : "Create Driver"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the driver "{selectedDriver?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDriver && deleteDriverMutation.mutate(selectedDriver.id)}
              disabled={deleteDriverMutation.isPending}
            >
              {deleteDriverMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}