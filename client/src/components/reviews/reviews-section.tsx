import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewList } from "./review-list";
import { ReviewForm } from "./review-form";

interface ReviewsSectionProps {
  itemType: string;
  itemId: number;
}

export function ReviewsSection({ itemType, itemId }: ReviewsSectionProps) {
  return (
    <div className="mt-10">
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="reviews" className="flex-1 md:flex-none">Read Reviews</TabsTrigger>
          <TabsTrigger value="write" className="flex-1 md:flex-none">Write a Review</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-6">
          <ReviewList itemType={itemType} itemId={itemId} />
        </TabsContent>
        <TabsContent value="write" className="mt-6">
          <ReviewForm itemType={itemType} itemId={itemId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}