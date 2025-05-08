import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Review type from schema
type Review = {
  id: number;
  userId: number;
  itemId: number;
  itemType: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
};

export default function AdminReviews() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use direct database access to fetch reviews with user data
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery<Review[]>({
    queryKey: ["/api/direct/reviews"],
  });

  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/reviews/${id}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      toast({
        title: "Review Approved",
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
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/reviews/${id}/reject`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      toast({
        title: "Review Rejected",
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
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/reviews/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/reviews"] });
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
      toast({
        title: "Review Deleted",
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

  const handleOpenDeleteDialog = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  // Format item type for display
  const formatItemType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get status badge variant based on review status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      case "pending":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Filter reviews based on search query
  const filteredReviews = searchQuery
    ? reviews.filter(
        (review) =>
          (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (review.user && 
            ((review.user.firstName + " " + review.user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) || 
             review.user.username.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : reviews;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reviews..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reviewsError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load reviews
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No reviews found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            {review.user ? `${review.user.firstName} ${review.user.lastName}` : "Unknown User"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="font-medium mr-1">{review.rating}</span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{review.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {review.comment}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatItemType(review.itemType)} #{review.itemId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(review.status) as any}>
                              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {review.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => approveReviewMutation.mutate(review.id)}
                                    disabled={approveReviewMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => rejectReviewMutation.mutate(review.id)}
                                    disabled={rejectReviewMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDeleteDialog(review)}
                              >
                                <XCircle className="h-4 w-4" />
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

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedReview && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">User:</span>{" "}
                  {selectedReview.user ? `${selectedReview.user.firstName} ${selectedReview.user.lastName}` : "Unknown User"}
                </div>
                <div>
                  <span className="font-medium">Rating:</span> {selectedReview.rating} ★
                </div>
                <div>
                  <span className="font-medium">Title:</span> {selectedReview.title}
                </div>
                <div>
                  <span className="font-medium">Comment:</span> {selectedReview.comment}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReview && deleteReviewMutation.mutate(selectedReview.id)}
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending && (
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