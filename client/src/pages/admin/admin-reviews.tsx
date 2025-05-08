import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MessageCircle, MoreHorizontal, Search, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

type Review = {
  id: number;
  userId: number;
  itemId: number;
  itemType: string;
  title: string;
  content: string;
  rating: number;
  status: string;
  dateOfStay?: string;
  helpfulVotes: number;
  verified: boolean;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
};

export default function AdminReviews() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Use direct database access
  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery<Review[]>({
    queryKey: ["/api/direct/reviews"],
  });
  
  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/reviews/${reviewId}`,
        { status: "approved" }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      toast({
        title: "Review approved",
        description: "The review has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to approve review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reject review mutation
  const rejectReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/reviews/${reviewId}`,
        { status: "rejected" }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      toast({
        title: "Review rejected",
        description: "The review has been rejected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reject review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      await apiRequest("DELETE", `/api/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      setShowDeleteDialog(false);
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter reviews based on tab, search query, and status
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchQuery === "" ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && review.status === "pending";
    if (activeTab === "approved") return matchesSearch && review.status === "approved";
    if (activeTab === "rejected") return matchesSearch && review.status === "rejected";
    
    return matchesSearch;
  });
  
  const handleApproveReview = (reviewId: number) => {
    approveReviewMutation.mutate(reviewId);
  };
  
  const handleRejectReview = (reviewId: number) => {
    rejectReviewMutation.mutate(reviewId);
  };
  
  const handleDeleteReview = () => {
    if (selectedReview) {
      deleteReviewMutation.mutate(selectedReview.id);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by title, content, or reviewer..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center pb-3">
              <TabsList>
                <TabsTrigger value="all">All Reviews</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              {renderReviewsTable()}
            </TabsContent>
            <TabsContent value="pending" className="m-0">
              {renderReviewsTable()}
            </TabsContent>
            <TabsContent value="approved" className="m-0">
              {renderReviewsTable()}
            </TabsContent>
            <TabsContent value="rejected" className="m-0">
              {renderReviewsTable()}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this review? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteReview} disabled={deleteReviewMutation.isPending}>
                {deleteReviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
  
  function renderReviewsTable() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Failed to load reviews
        </div>
      );
    }
    
    if (filteredReviews.length === 0) {
      return (
        <div className="text-center py-10">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Reviews Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "There are no reviews in this category yet"}
          </p>
        </div>
      );
    }
    
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    {review.user.firstName} {review.user.lastName}
                  </TableCell>
                  <TableCell>
                    {review.itemType.charAt(0).toUpperCase() + review.itemType.slice(1)} #{review.itemId}
                  </TableCell>
                  <TableCell>{getRatingStars(review.rating)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{review.title}</TableCell>
                  <TableCell>{format(new Date(review.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {review.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApproveReview(review.id)}
                            disabled={approveReviewMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRejectReview(review.id)}
                            disabled={rejectReviewMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReview(review);
                            setShowDeleteDialog(true);
                          }}>
                            Delete
                          </DropdownMenuItem>
                          {review.status === "rejected" && (
                            <DropdownMenuItem onClick={() => handleApproveReview(review.id)}>
                              Approve
                            </DropdownMenuItem>
                          )}
                          {review.status === "approved" && (
                            <DropdownMenuItem onClick={() => handleRejectReview(review.id)}>
                              Reject
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
}