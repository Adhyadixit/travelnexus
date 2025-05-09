import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  joinConversation,
  leaveConversation,
  sendTypingIndicator,
  sendNewMessageNotification,
  subscribeToTypingIndicators,
  subscribeToNewMessages,
  unsubscribeFromEvent
} from "@/lib/socket";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { TypingIndicator } from "./typing-indicator";

// Message type from schema with fallback fields for compatibility
type Message = {
  id: number;
  conversationId: number;
  content?: string;
  body?: string;
  senderType?: string;
  type?: string;
  createdAt?: string;
  sentAt?: string;
  created_at?: string;
  readAt?: string | null;
  [key: string]: any; // Allow any other properties that might be in the message
};

// Conversation type from schema
type Conversation = {
  id: number;
  userId: number | null;
  guestUserId: number | null;
  subject: string | null;
  status: string;
  lastMessageAt: string;
  readByUser: boolean;
  readByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

interface ChatWidgetProps {
  currentConversationId?: number | null;
  autoOpen?: boolean;
}

export function ChatWidget({ currentConversationId = null, autoOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Open chat when autoOpen changes to true
  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);
  
  // Store the last session ID and guest ID for guest users
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('guestSessionId');
    return savedId || null;
  });
  
  const [guestUserId, setGuestUserId] = useState<number | null>(() => {
    const savedId = localStorage.getItem('guestUserId');
    return savedId ? parseInt(savedId, 10) : null;
  });
  
  // Get user conversations or current conversation
  const {
    data: userConversations = [],
    isLoading: conversationsLoading
  } = useQuery<Conversation[]>({
    queryKey: [user ? "/api/user-conversations" : "/api/guest-conversations", currentConversationId],
    queryFn: async () => {
      // If we have a specific conversation ID, prioritize that
      if (currentConversationId) {
        try {
          // When we have a specific conversation ID, try to get just that one
          const res = await fetch(`/api/conversations/${currentConversationId}`);
          if (!res.ok) throw new Error("Failed to fetch conversation");
          const conversation = await res.json();
          return [conversation]; // Return as array to match expected type
        } catch (error) {
          console.error(`Error fetching conversation ${currentConversationId}:`, error);
          return [];
        }
      }
      
      // Fetch user conversations if authenticated
      if (user) {
        try {
          const res = await fetch("/api/user-conversations");
          if (!res.ok) throw new Error("Failed to fetch conversations");
          return await res.json();
        } catch (error) {
          console.error("Error fetching user conversations:", error);
          return [];
        }
      } else {
        // For guest users, try to fetch guest conversations
        try {
          console.log("Fetching guest conversations...");
          
          // If we have a stored guestUserId, include it in the request
          const url = guestUserId 
            ? `/api/guest-conversations?guestUserId=${guestUserId}` 
            : "/api/guest-conversations";
            
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch guest conversations");
          const data = await res.json();
          console.log("Retrieved guest conversations:", data);
          
          // If we got conversations back and don't have a guestUserId stored yet,
          // store the ID from the first conversation
          if (data.length > 0 && !guestUserId && data[0].guestUserId) {
            const newGuestId = data[0].guestUserId;
            localStorage.setItem('guestUserId', String(newGuestId));
            setGuestUserId(newGuestId);
          }
          
          return data;
        } catch (error) {
          console.error("Error fetching guest conversations:", error);
          return [];
        }
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds to check for new conversations
    enabled: true // Always enabled for both users and guests
  });

  // Get active conversation (first one for now, or specified conversation)
  const activeConversation = currentConversationId 
    ? userConversations.find(c => c.id === currentConversationId) 
    : userConversations[0];

  // Get messages for selected conversation with polling for regular updates
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation?.id],
    queryFn: async () => {
      if (!activeConversation) return [];
      try {
        const res = await fetch(`/api/messages?conversationId=${activeConversation.id}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        return await res.json();
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    enabled: !!activeConversation,
    // Poll every 3 seconds to get new messages
    refetchInterval: 3000,
  });

  // Format date
  const formatMessageDate = (dateString: string | undefined): string => {
    try {
      if (!dateString) return "";
      return format(new Date(dateString), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeConversation) throw new Error("No active conversation");
      
      const response = await apiRequest("POST", "/api/messages", {
        conversationId: activeConversation.id,
        message
      });
      
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Guest info state for first-time guest chat
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
  });
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      // If user is logged in, create with user account
      if (user) {
        const response = await apiRequest("POST", "/api/conversations", {
          subject: "New Support Request",
          message: message,
          itemType: "livechat"
        });
        return response.json();
      } 
      // For guests, create with guest info
      else {
        if (!guestInfo.name || !guestInfo.email) {
          // If we don't have guest info, show form instead of creating conversation
          setShowGuestForm(true);
          throw new Error("Guest info required");
        }

        const response = await apiRequest("POST", "/api/conversations", {
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          subject: "Live Chat Support",
          message: message,
          itemType: "livechat"
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      console.log("New conversation created:", data);
      
      // Store guest user ID in localStorage for persistence
      if (!user && data.guestUserId) {
        localStorage.setItem('guestUserId', String(data.guestUserId));
        setGuestUserId(data.guestUserId);
        
        // Also update the query parameters for guest conversations
        queryClient.invalidateQueries({ 
          queryKey: ["/api/guest-conversations"],
          refetchType: "all"
        });
      } else if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/user-conversations"] });
      }
      
      setMessageInput("");
      setShowGuestForm(false);
    },
    onError: (error: Error) => {
      // Only show error if it's not because we need guest info
      if (error.message !== "Guest info required") {
        toast({
          title: "Error",
          description: `Failed to create conversation: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  });

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Send typing indicator if we have an active conversation
    if (activeConversation && value.trim() !== '') {
      if (!isTyping) {
        setIsTyping(true);
        const userId = user ? user.id : (activeConversation.guestUserId || 0);
        const userType = user ? "user" : "guest";
        sendTypingIndicator(activeConversation.id, userId, userType, true);
      }
      
      // Clear existing timeout if there is one
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set a new timeout to stop typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        setIsTyping(false);
        const userId = user ? user.id : (activeConversation.guestUserId || 0);
        const userType = user ? "user" : "guest";
        sendTypingIndicator(activeConversation.id, userId, userType, false);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };
  
  // Handle send message
  const handleSendMessage = () => {
    // Check if we have necessary data
    if (!messageInput.trim()) {
      console.log('Message input is empty');
      return;
    }
    
    // If showing guest form, don't send message
    if (showGuestForm) {
      return;
    }
    
    // Handle case with no active conversation
    if (!activeConversation) {
      console.log('No active conversation, creating a new one');
      createConversationMutation.mutate(messageInput);
      return;
    }
    
    console.log(`Sending message to conversation ID: ${activeConversation.id}`, messageInput);
    
    try {
      // First, store guest user ID if this is a guest
      if (!user && activeConversation.guestUserId) {
        // Store both the session ID and the guest user ID
        localStorage.setItem('guestSessionId', String(activeConversation.guestUserId));
        localStorage.setItem('guestUserId', String(activeConversation.guestUserId));
        setSessionId(String(activeConversation.guestUserId));
        setGuestUserId(activeConversation.guestUserId);
        console.log(`Stored guestUserId ${activeConversation.guestUserId} in localStorage`);
      }
      
      // Send the message
      sendMessageMutation.mutate(messageInput);
      
      // Reset typing indicator
      setIsTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      const userId = user ? user.id : (activeConversation.guestUserId || 0);
      const userType = user ? "user" : "guest";
      sendTypingIndicator(activeConversation.id, userId, userType, false);
    } catch (error) {
      console.error('Error in send message mutation:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-scroll when opened
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen]);
  
  // Handle WebSocket connections for the active conversation
  useEffect(() => {
    if (activeConversation?.id) {
      // Join the conversation channel
      joinConversation(activeConversation.id);
      
      // Listen for typing events
      const handleTypingEvent = (data: any) => {
        // Only show typing indicator for admin when user or guest is viewing
        if (data.userType === 'admin' && data.isTyping) {
          setAdminTyping(true);
        } else if (data.userType === 'admin' && !data.isTyping) {
          setAdminTyping(false);
        }
      };
      
      // Listen for new messages
      const handleNewMessage = (message: any) => {
        // Update messages immediately when received via WebSocket
        queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation.id] });
        
        // If admin sent a message, clear typing indicator
        if (message.senderType === 'admin') {
          setAdminTyping(false);
        }
      };
      
      // Subscribe to events
      subscribeToTypingIndicators(handleTypingEvent);
      subscribeToNewMessages(handleNewMessage);
      
      // Cleanup when component unmounts or conversation changes
      return () => {
        leaveConversation(activeConversation.id);
        unsubscribeFromEvent('user-typing');
        unsubscribeFromEvent('message-received');
      };
    }
  }, [activeConversation?.id]);

  return (
    <>
      {/* Fixed chat button for mobile */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Sheet */}
      <Sheet 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open && messagesEndRef.current) {
            // Reset scroll position when closing
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:w-[350px] mx-auto inset-0 h-[60vh] top-[20vh] rounded-t-xl shadow-lg p-0 md:right-4">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Customer Support</SheetTitle>
            <SheetDescription>
              Chat with our team for assistance
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* Messages area - ensuring proper scrolling with fixed height */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(60vh - 140px)' }}>
              {showGuestForm ? (
                <div className="p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Enter Your Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Your email"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowGuestForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          if (guestInfo.name && guestInfo.email) {
                            createConversationMutation.mutate(messageInput);
                          } else {
                            toast({
                              title: "Missing information",
                              description: "Please provide both name and email to start chatting",
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={createConversationMutation.isPending}
                      >
                        {createConversationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Please wait...
                          </>
                        ) : (
                          "Start Chat"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : conversationsLoading || messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !activeConversation ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active conversations</p>
                  <p className="text-sm mt-2">
                    Our support team is ready to help you. Type a message below to start chatting.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    // Determine if user or admin message
                    const isUser = message.senderType !== "admin";
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex mb-2",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3 shadow-sm",
                            isUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content || message.body || "No message content"}
                          </p>
                          <p className="text-xs mt-1 opacity-70 text-right">
                            {formatMessageDate(message.createdAt || message.sentAt || message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Admin typing indicator */}
                  {adminTyping && (
                    <div className="flex justify-start mb-2">
                      <TypingIndicator className="max-w-[80%]" />
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <SheetFooter className="absolute bottom-0 left-0 right-0 bg-background border-t p-3 z-50">
              <div className="flex w-full space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending || createConversationMutation.isPending}
                  onClick={handleSendMessage}
                >
                  {sendMessageMutation.isPending || createConversationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ChatWidget;