import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-mobile"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    
    // Enhanced options for mobile devices
    const mobileOptions = {
      dragFree: true,
      loop: true,
      draggable: true,
      speed: 10,
      ...opts,
    };
    
    // Pass the options directly to avoid typing issues
    const [carouselRef, api] = useEmblaCarousel(
      {
        axis: orientation === "horizontal" ? "x" : "y" as "x" | "y",
        ...(isMobile ? {
          dragFree: true,
          loop: true,
          draggable: true,
          speed: 10,
        } : {}),
        ...opts
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])
    
    // Enhanced touch handling for mobile devices
    React.useEffect(() => {
      if (!api || !carouselRef || !isMobile) {
        return
      }
      
      // Refresh on window resize
      const handleResize = () => {
        if (api) {
          api.reInit()
        }
      }
      
      window.addEventListener('resize', handleResize)
      
      // Add responsive behavior to handle orientation changes
      const handleOrientationChange = () => {
        if (api) {
          setTimeout(() => api.reInit(), 200) // Small delay to ensure DOM updates
        }
      }
      
      window.addEventListener('orientationchange', handleOrientationChange)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }, [api, carouselRef, isMobile])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div 
      ref={carouselRef} 
      className={cn(
        "overflow-hidden",
        isMobile && "mobile-slider mobile-gallery" // Enhanced mobile styling
      )}
    >
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          isMobile && "touch-pan-x mobile-slider", // Enable horizontal touch handling
          className
        )}
        style={isMobile ? {
          touchAction: "pan-x", // Enable native horizontal swiping
          WebkitOverflowScrolling: "touch", // Smooth inertial scrolling for iOS
          scrollSnapType: orientation === "horizontal" ? "x mandatory" : "y mandatory", // Snap to slides
        } : undefined}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      data-mobile-slide={isMobile ? "true" : undefined}
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        isMobile && "p-1 select-none mobile-gallery-item", // Enhanced mobile touch handling
        className
      )}
      style={isMobile ? {
        scrollSnapAlign: "center", // Ensure slides snap properly
        touchAction: orientation === "horizontal" ? "pan-x" : "pan-y", // Better touch handling
      } : undefined}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute rounded-full z-10 carousel-arrow",
        isMobile 
          ? "h-10 w-10 left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md" 
          : "h-8 w-8",
        !isMobile && orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute rounded-full z-10 carousel-arrow",
        isMobile 
          ? "h-10 w-10 right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md" 
          : "h-8 w-8",
        !isMobile && orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
