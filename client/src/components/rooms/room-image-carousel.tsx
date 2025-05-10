import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  // Fetch room images from the API using a direct API call for now
  const [roomImageUrls, setRoomImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomImages = async () => {
      if (!roomId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/hotel-room-types/${roomId}/images`);
        
        if (!response.ok) {
          throw new Error(`Error fetching room images: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Room images API response:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          const urls = data.map((img: any) => img.imageUrl);
          setRoomImageUrls(urls);
        } else {
          setRoomImageUrls([]);
        }
      } catch (error) {
        console.error("Error fetching room images:", error);
        setError("Failed to load room images");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomImages();
  }, [roomId]);
  
  // Parse passed images as fallback
  const parsedPassedImages = useMemo(() => {
    if (typeof images === 'string') {
      return safeJsonParse(images, []);
    }
    return Array.isArray(images) ? images : [];
  }, [images]);
  
  // Use images in this priority: API images -> passed images -> fallback image
  const allImages = roomImageUrls.length > 0 
    ? roomImageUrls 
    : parsedPassedImages.length > 0
      ? parsedPassedImages
      : fallbackImage ? [fallbackImage] : [];
  
  console.log('Room image carousel:', { 
    roomId, 
    roomName, 
    roomImageUrls, 
    parsedPassedImages, 
    fallbackImage,
    allImages,
    loading,
    error
  });
  
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