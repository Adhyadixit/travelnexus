import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/ui/bottom-navigation";
import ChatWidget from "@/components/chat/chat-widget";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  withBottomPadding?: boolean;
  autoOpenChat?: boolean;
  currentConversationId?: number | null;
}

export function MobileLayout({ 
  children, 
  className,
  withBottomPadding = true,
  autoOpenChat = false,
  currentConversationId = null
}: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <main className={cn(
        "flex-grow pt-0",
        withBottomPadding && "pb-16", // Add padding at the bottom for the navigation bar
        className
      )}>
        {children}
      </main>
      <ChatWidget autoOpen={autoOpenChat} currentConversationId={currentConversationId} />
      <BottomNavigation />
    </div>
  );
}

export default MobileLayout;
