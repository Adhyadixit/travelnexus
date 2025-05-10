import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Review, User } from "@shared/schema";
import { Star, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Random traveler names for admin users to display instead of "Admin User"
const TRAVELER_NAMES = [
  { firstName: "James", lastName: "Wilson" },
  { firstName: "Sophia", lastName: "Martinez" },
  { firstName: "Alexander", lastName: "Johnson" },
  { firstName: "Olivia", lastName: "Taylor" },
  { firstName: "Daniel", lastName: "Anderson" },
  { firstName: "Emma", lastName: "Garcia" },
  { firstName: "Michael", lastName: "Brown" },
  { firstName: "Ava", lastName: "Thompson" },
  { firstName: "William", lastName: "Davis" },
  { firstName: "Emily", lastName: "Rodriguez" },
  { firstName: "Benjamin", lastName: "Lee" },
  { firstName: "Isabella", lastName: "Wright" },
  { firstName: "Ethan", lastName: "Thomas" },
  { firstName: "Mia", lastName: "Patel" },
  { firstName: "Jacob", lastName: "Kim" },
  { firstName: "Charlotte", lastName: "Lopez" },
  { firstName: "Ryan", lastName: "Walker" },
  { firstName: "Lily", lastName: "Turner" },
  { firstName: "Nathan", lastName: "Bennett" },
  { firstName: "Zoe", lastName: "Mitchell" }
];

interface ReviewListProps {
  itemType: string;
  itemId: number;
}

interface ReviewWithUser extends Review {
  user: User;
}

export function ReviewList({ itemType, itemId }: ReviewListProps) {
  const [expanded, setExpanded] = useState(false);
  
  const { data: reviews, isLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/reviews/${itemType}/${itemId}`],
  });

  // Create a consistent mapping of review IDs to random names for admin users
  const adminNameMapping = useMemo(() => {
    if (!reviews) return {};
    
    const mapping: Record<number, typeof TRAVELER_NAMES[number]> = {};
    
    // For each review from an admin user, assign a random name
    reviews.forEach(review => {
      if (review.user.role === 'admin') {
        // Use the review ID as the seed for consistency
        const nameIndex = review.id % TRAVELER_NAMES.length;
        mapping[review.id] = TRAVELER_NAMES[nameIndex];
      }
    });
    
    return mapping;
  }, [reviews]);
  
  // Initially show only 3 reviews
  const displayedReviews = expanded ? reviews : reviews?.slice(0, 3);
  
  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  const getRatingDistribution = () => {
    if (!reviews || reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    return distribution;
  };
  
  const distribution = getRatingDistribution();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full mt-4" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium">No reviews yet</h3>
        <p className="text-neutral-500 mt-2">Be the first to review this {itemType}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Guest Reviews</h2>
          <div className="flex items-center mt-2">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(getAverageRating())) 
                      ? "text-yellow-400 fill-current" 
                      : "text-neutral-300"
                  }`} 
                />
              ))}
            </div>
            <span className="text-xl font-semibold">{getAverageRating()}</span>
            <span className="text-neutral-500 ml-2">({reviews.length} reviews)</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow w-full md:w-auto">
          <h3 className="font-medium mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2 mb-1">
              <span className="w-3">{rating}</span>
              <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ 
                    width: `${reviews.length > 0 
                      ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <span className="text-xs text-neutral-500">
                {distribution[rating as keyof typeof distribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        {displayedReviews?.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.user.role === 'admin' && adminNameMapping[review.id]
                        ? `${adminNameMapping[review.id].firstName.charAt(0)}${adminNameMapping[review.id].lastName.charAt(0)}`
                        : `${review.user.firstName?.charAt(0) || ''}${review.user.lastName?.charAt(0) || ''}`
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {review.user.role === 'admin' && adminNameMapping[review.id]
                        ? `${adminNameMapping[review.id].firstName} ${adminNameMapping[review.id].lastName}`
                        : `${review.user.firstName || ''} ${review.user.lastName || ''}`
                      }
                    </h4>
                    <p className="text-sm text-neutral-500">
                      {review.dateOfStay 
                        ? `Stayed in ${format(new Date(review.dateOfStay), 'MMMM yyyy')}` 
                        : format(new Date(review.createdAt), 'PP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < review.rating ? "text-yellow-400 fill-current" : "text-neutral-300"
                      }`} 
                    />
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium mb-2">{review.title}</h5>
                <p className="text-neutral-600">{review.comment}</p>
              </div>
              
              {review.verified && (
                <Badge variant="outline" className="mt-3">
                  Verified Stay
                </Badge>
              )}
              
              {review.images && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {(typeof review.images === 'string' ? JSON.parse(review.images) : review.images)
                    .map((image: string, i: number) => (
                      <img 
                        key={i} 
                        src={image} 
                        alt={`Review image ${i+1}`} 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ))}
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-neutral-500">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpfulVotes})
                </Button>
                
                {review.response && (
                  <div className="bg-neutral-50 p-3 rounded-md text-sm mt-3 border">
                    <p className="font-medium">Response from the property:</p>
                    <p className="mt-1 text-neutral-600">{review.response}</p>
                    {review.responseDate && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Responded on {format(new Date(review.responseDate), 'PP')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {reviews.length > 3 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show fewer reviews
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show all {reviews.length} reviews
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}