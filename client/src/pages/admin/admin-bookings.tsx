import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Booking, User } from "@shared/schema";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Eye, Check, X, Calendar, Package, Building, Car, Ship, CalendarClock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBookings() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [newStatus, setNewStatus] = useState<string>("");
  
  // Fetch all bookings
  const { 
    data: bookings = [],
    isLoading: isLoadingBookings
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/admin"],
  });
  
  // Fetch all users
  const {
    data: users = [],
    isLoading: isLoadingUsers
  } = useQuery<User[]>({
    queryKey: ["/api/users/admin"],
  });
  
  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/admin"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
      setIsUpdateStatusDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update booking status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle view booking
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };
  
  // Handle update status
  const handleUpdateStatus = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setIsUpdateStatusDialogOpen(true);
  };
  
  // Handle status update submission
  const handleStatusUpdateSubmit = () => {
    if (selectedBooking && newStatus) {
      updateBookingStatusMutation.mutate({
        id: selectedBooking.id,
        status: newStatus,
      });
    }
  };
  
  // Get user name by ID
  const getUserName = (id: number) => {
    const user = users.find(u => u.id === id);
    return user ? user.fullName || user.username : "Unknown User";
  };
  
  // Get booking type icon
  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case "package":
        return <Package className="h-4 w-4" />;
      case "hotel":
        return <Building className="h-4 w-4" />;
      case "driver":
        return <Car className="h-4 w-4" />;
      case "cruise":
        return <Ship className="h-4 w-4" />;
      case "event":
        return <CalendarClock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "outline";
    }
  };
  
  // Get payment status badge variant
  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  // Filter bookings based on tab and search query
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = activeTab === "all" || booking.status === activeTab;
    const matchesSearch = searchQuery 
      ? getUserName(booking.userId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toString().includes(searchQuery) ||
        booking.bookingType.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesStatus && matchesSearch;
  });
  
  const isLoading = isLoadingBookings || isLoadingUsers;
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">Manage Bookings</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by booking ID, customer name, or booking type..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full md:w-auto mb-6 grid grid-cols-5 md:flex">
            <TabsTrigger value="all" className="flex-1 md:flex-initial">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 md:flex-initial">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-1 md:flex-initial">Confirmed</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-initial">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 md:flex-initial">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {activeTab === "all" ? "All Bookings" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">No Bookings Found</p>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : activeTab !== "all" ? `There are no ${activeTab} bookings.` : "There are no bookings in the system yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell>{getUserName(booking.userId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getBookingTypeIcon(booking.bookingType)}
                            <span className="capitalize">{booking.bookingType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{formatDate(booking.startDate)}</div>
                            <div>{formatDate(booking.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.guestCount}</TableCell>
                        <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.status) as any} className="capitalize">
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentBadgeVariant(booking.paymentStatus) as any} className="capitalize">
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewBooking(booking)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateStatus(booking)}
                              title="Update Status"
                            >
                              {booking.status === "confirmed" ? (
                                <Check className="h-4 w-4" />
                              ) : booking.status === "cancelled" ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Calendar className="h-4 w-4" />
                              )}
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
      
      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Booking Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Booking Type:</span>
                      <span className="font-medium capitalize">{selectedBooking.bookingType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Item ID:</span>
                      <span className="font-medium">{selectedBooking.itemId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Start Date:</span>
                      <span className="font-medium">{formatDate(selectedBooking.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">End Date:</span>
                      <span className="font-medium">{formatDate(selectedBooking.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Guests:</span>
                      <span className="font-medium">{selectedBooking.guestCount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Customer:</span>
                      <span className="font-medium">{getUserName(selectedBooking.userId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Booking Date:</span>
                      <span className="font-medium">{formatDate(selectedBooking.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Special Requests:</span>
                      <span className="font-medium">{selectedBooking.specialRequests || "None"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Payment Status:</span>
                      <Badge variant={getPaymentBadgeVariant(selectedBooking.paymentStatus) as any} className="capitalize">
                        {selectedBooking.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Transaction ID:</span>
                      <span className="font-medium">{selectedBooking.transactionId || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Booking Status:</span>
                      <Badge variant={getStatusBadgeVariant(selectedBooking.status) as any} className="capitalize">
                        {selectedBooking.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Last Updated:</span>
                      <span className="font-medium">{formatDate(selectedBooking.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleUpdateStatus(selectedBooking);
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Current Status
              </label>
              <Badge variant={getStatusBadgeVariant(selectedBooking?.status || "") as any} className="capitalize">
                {selectedBooking?.status || ""}
              </Badge>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                New Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdateStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStatusUpdateSubmit}
              disabled={updateBookingStatusMutation.isPending || newStatus === selectedBooking?.status}
            >
              {updateBookingStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}