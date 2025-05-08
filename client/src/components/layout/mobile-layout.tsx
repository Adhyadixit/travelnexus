import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/ui/bottom-navigation";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  withBottomPadding?: boolean;
}

export function MobileLayout({ 
  children, 
  className,
  withBottomPadding = true
}: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <main className={cn(
        "flex-grow",
        withBottomPadding && "pb-16", // Add padding at the bottom for the navigation bar
        className
      )}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}

export default MobileLayout;
