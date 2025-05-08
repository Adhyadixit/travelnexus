import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface ReviewFormProps {
  itemType: string;
  itemId: number;
}

const reviewFormSchema = insertReviewSchema.extend({
  rating: z.coerce.number().min(1, "Please select a rating").max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  comment: z.string().min(10, "Review must be at least 10 characters").max(1000, "Review cannot exceed 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export function ReviewForm({ itemType, itemId }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      userId: user?.id,
      itemType,
      itemId,
      rating: 0,
      title: "",
      comment: "",
      dateOfStay: new Date().toISOString(),
    },
  });
  
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for sharing your experience!",
      });
      
      // Invalidate the reviews cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/${itemType}/${itemId}`] });
      
      // Reset form
      form.reset({
        userId: user?.id,
        itemType,
        itemId,
        rating: 0,
        title: "",
        comment: "",
        dateOfStay: new Date().toISOString(),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting review",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ReviewFormValues) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to submit a review",
        variant: "destructive",
      });
      return;
    }
    
    submitReviewMutation.mutate({
      ...data,
      userId: user.id,
    });
  };
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>Share your experience with others</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="mb-4">Please log in to submit a review</p>
          <Button variant="outline">Log In</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with others</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer ${
                            (field.value >= star || hoveredRating >= star)
                              ? "text-yellow-400 fill-current"
                              : "text-neutral-300"
                          }`}
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                        />
                      ))}
                      <input
                        type="hidden"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select a rating from 1 to 5 stars
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summarize your stay in a headline" {...field} />
                  </FormControl>
                  <FormDescription>
                    Keep it short and descriptive
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your experience... What did you like? What could be improved?" 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 10 characters, maximum 1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}