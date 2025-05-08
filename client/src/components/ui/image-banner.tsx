import { cn } from "@/lib/utils";

interface ImageBannerProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  children?: React.ReactNode;
}

export function ImageBanner({
  imageUrl,
  title,
  subtitle,
  className,
  height = 'md',
  overlay = true,
  children
}: ImageBannerProps) {
  const heightClass = {
    sm: 'h-40 md:h-52',
    md: 'h-56 md:h-72',
    lg: 'h-64 md:h-96',
  }[height];

  return (
    <div 
      className={cn(
        "relative w-full bg-no-repeat bg-cover bg-center flex items-center justify-center",
        heightClass,
        className
      )}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      )}
      
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg md:text-xl text-white text-opacity-90 max-w-3xl mx-auto">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export default ImageBanner;
