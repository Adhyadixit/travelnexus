import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeJsonParse } from "@/lib/utils";

interface RoomImageCarouselProps {
  roomId: number;
  roomName: string;
  images: string | string[];
  fallbackImage?: string;
}

export function RoomImageCarousel({ 
  roomId, 
  roomName, 
  images, 
  fallbackImage 
}: RoomImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Parse images if they're in JSON format
  const parsedImages = typeof images === 'string' 
    ? safeJsonParse(images, [])
    : Array.isArray(images) ? images : [];
  
  // Use fallback if no images are available
  const allImages = parsedImages.length > 0 
    ? parsedImages 
    : fallbackImage ? [fallbackImage] : [];
  
  if (allImages.length === 0) {
    return (
      <div className="h-full w-full bg-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">No images available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? allImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentIndex === allImages.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative h-full w-full overflow-hidden group">
      <img 
        src={allImages[currentIndex]} 
        alt={`${roomName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />
      
      {/* Only show navigation if there are multiple images */}
      {allImages.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Image counter */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
            {currentIndex + 1} / {allImages.length}
          </div>
        </>
      )}
    </div>
  );
}