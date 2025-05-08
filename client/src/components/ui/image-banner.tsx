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
    sm: 'min-h-[10rem] md:min-h-[13rem]',
    md: 'min-h-[14rem] md:min-h-[18rem]',
    lg: 'min-h-[16rem] md:min-h-[24rem]',
  }[height];

  return (
    <div 
      className={cn(
        "relative w-full bg-no-repeat bg-cover bg-center flex items-center justify-center mt-0 pt-0",
        heightClass,
        className
      )}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      )}
      
      <div className="relative z-10 text-center text-white px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-heading font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm md:text-xl text-white text-opacity-90 max-w-3xl mx-auto">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export default ImageBanner;
