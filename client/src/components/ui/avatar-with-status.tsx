import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithStatusProps {
  src?: string;
  fallback: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarWithStatus({
  src,
  fallback,
  isOnline = false,
  size = "md",
  className,
}: AvatarWithStatusProps) {
  const statusSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const avatarSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(avatarSizes[size])}>
        <AvatarImage src={src} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {isOnline && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-success border-2 border-background",
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}
