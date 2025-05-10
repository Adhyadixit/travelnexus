import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { MessageCircle, Send, Loader2, RefreshCw } from "lucide-react";
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
  initialConversationId?: number | null;
}

interface ChatWidgetProps {
  currentConversationId?: number | null;
  autoOpen?: boolean;
  initialConversationId?: number | null;
  onClose?: () => void;
}

export function ChatWidget({ 
  currentConversationId = null, 
  autoOpen = false,
  initialConversationId = null,
  onClose
}: ChatWidgetProps) {
  // Use initialConversationId if provided, otherwise use currentConversationId
  const activeConversationId = initialConversationId || currentConversationId;
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Open chat when autoOpen changes to true
  useEffect(() => {
    console.log("ChatWidget autoOpen prop:", autoOpen);
    // Always set isOpen to match autoOpen exactly
    setIsOpen(autoOpen);
  }, [autoOpen]);
  
  // Store the last session ID and guest ID for guest users
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('guestSessionId');
    return savedId || null;
  });
  
  // Important: Load guest user ID from localStorage for persistence across sessions
  const [guestUserId, setGuestUserId] = useState<number | null>(() => {
    const savedId = localStorage.getItem('guestUserId');
    console.log("Loaded guestUserId from localStorage:", savedId);
    return savedId ? parseInt(savedId, 10) : null;
  });
  
  // Debug function to reset guest state completely
  const resetGuestState = () => {
    localStorage.removeItem('guestUserId');
    localStorage.removeItem('guestSessionId');
    setGuestUserId(null);
    setSessionId(null);
    
    // Show success toast
    toast({
      title: "Guest state reset",
      description: "Guest chat state has been completely reset. You can now start a new chat as a guest.",
      variant: "default",
    });
    
    // Force show guest form
    setShowGuestForm(true);
    
    // Refresh guest conversations
    queryClient.invalidateQueries({ 
      queryKey: ["/api/guest-conversations"],
      refetchType: "all"
    });
  };
  
  // Log guestUserId on mount to help debugging
  useEffect(() => {
    if (guestUserId) {
      console.log(`Using stored guest user ID: ${guestUserId}`);
    }
  }, [guestUserId]);
  
  // Get user conversations or current conversation
  const {
    data: userConversations = [],
    isLoading: conversationsLoading
  } = useQuery<Conversation[]>({
    queryKey: [user ? "/api/user-conversations" : "/api/guest-conversations", activeConversationId],
    queryFn: async () => {
      // If we have a specific conversation ID, prioritize that
      if (activeConversationId) {
        try {
          // When we have a specific conversation ID, try to get just that one
          const res = await fetch(`/api/conversations/${activeConversationId}`);
          if (!res.ok) throw new Error("Failed to fetch conversation");
          const conversation = await res.json();
          return [conversation]; // Return as array to match expected type
        } catch (error) {
          console.error(`Error fetching conversation ${activeConversationId}:`, error);
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

  // Show guest form if there are no conversations for guest users
  useEffect(() => {
    // For guest users, if we have an ID but no conversations, show the form
    if (!user && guestUserId && userConversations.length === 0) {
      console.log("No conversations found for guest user, showing form");
      setShowGuestForm(true);
    }
  }, [userConversations, user, guestUserId]);

  // Get active conversation (first one for now, or specified conversation)
  const activeConversation = activeConversationId 
    ? userConversations.find(c => c.id === activeConversationId) 
    : userConversations[0];

  // Initial chat setup - if we're a guest with no conversations, show the form immediately
  useEffect(() => {
    if (!user && isOpen && (!userConversations || userConversations.length === 0)) {
      console.log("No conversations found for guest, showing guest form");
      setShowGuestForm(true);
    }
  }, [isOpen, user, userConversations]);

  // Get messages for selected conversation with polling for regular updates
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation?.id, guestUserId],
    queryFn: async () => {
      if (!activeConversation) return [];
      
      // If we're a guest without a guestUserId, show the guest form first
      if (!user && !guestUserId) {
        console.log("No guest user ID for message fetch, showing guest form");
        setShowGuestForm(true);
        return [];
      }
      
      try {
        // Include guestUserId for non-authenticated users to bypass session auth
        let url = `/api/messages?conversationId=${activeConversation.id}`;
        if (!user && guestUserId) {
          url += `&guestUserId=${guestUserId}`;
        }
        
        console.log(`Fetching messages from: ${url}`);
        const res = await fetch(url);
        
        if (!res.ok) {
          // If we get a 401 or 403 as a guest, we need to show the guest form
          if ((res.status === 401 || res.status === 403) && !user) {
            console.log("Auth error for guest user, showing form");
            // Clear the stored guest ID since it's invalid
            if (guestUserId) {
              console.log("Clearing invalid guest user ID");
              localStorage.removeItem('guestUserId');
              localStorage.removeItem('guestSessionId');
              setGuestUserId(null);
              setSessionId(null);
            }
            setShowGuestForm(true);
            return [];
          }
          
          const errorData = await res.json().catch(() => ({}));
          console.error(`Error response from server: ${res.status}`, errorData);
          throw new Error(errorData.error || "Failed to fetch messages");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    enabled: !!activeConversation,
    // Poll every 3 seconds to get new messages
    refetchInterval: 3000,
    // Don't retry on 401/403 failures
    retry: (failureCount, error) => {
      // If it's an auth error for a guest user, don't retry
      if (error instanceof Error && 
          (error.message.includes("Unauthorized") || error.message.includes("Access denied")) && 
          !user) {
        return false;
      }
      // Otherwise retry up to 3 times
      return failureCount < 3;
    }
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
      
      // For guest users, use the special guest message endpoint
      if (!user && guestUserId) {
        // Make sure the IDs are numbers, not strings
        const payload = {
          conversationId: Number(activeConversation.id),
          message,
          guestUserId: Number(guestUserId)
        };
        
        console.log("Guest sending message with payload:", payload);
        try {
          const response = await apiRequest("POST", "/api/guest-send-message", payload);
          return response.json();
        } catch (error) {
          console.error("Failed to send guest message:", error);
          throw new Error("Failed to send message. Please try again.");
        }
      } else {
        // For authenticated users, use the regular endpoint
        const payload = {
          conversationId: activeConversation.id,
          message
        };
        
        console.log("Sending message with payload:", payload);
        const response = await apiRequest("POST", "/api/messages", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation?.id, guestUserId] });
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
  // Initialize showGuestForm - default to false, we'll set it in useEffect
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  // Only reset guest chat on first load, not on every page refresh
  useEffect(() => {
    if (!user && !guestUserId) {
      // We only clear if we don't already have a guestUserId 
      // This preserves guest chat sessions across page refreshes
      // Show the guest form for new guest users
      setShowGuestForm(true);
    }
  }, [user, guestUserId]); // Only runs when the user auth state changes or on initial load

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
      
      // If guest user without stored user ID, show the form first
      if (!user && !guestUserId) {
        console.log("New guest user, showing information form first");
        setShowGuestForm(true);
        return;
      }
      
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
        queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation.id, guestUserId] });
        
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
          if (!open) {
            // Call onClose callback when chat is closed
            if (onClose) {
              onClose();
            }
            // Reset scroll position when closing
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "auto" });
            }
          }
        }}
        // On desktop, we don't need a full modal (darkened background) approach
        modal={isDesktop ? false : true}
      >
        <SheetContent 
          side={isDesktop ? "right" : "bottom"}
          className={cn(
            "w-[95%] mx-auto fixed p-0 border rounded-xl shadow-lg",
            isDesktop ? 
              "right-8 left-auto bottom-24 h-[500px] w-[380px]" : 
              "left-[2.5%] right-[2.5%] h-[60vh] top-auto bottom-16 sm:w-[350px]"
          )}
          style={{
            transform: 'none',
            position: 'fixed',
            animation: 'none',
            transition: 'opacity 0.2s ease',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            zIndex: 100
          }}
        >
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <div>
                <SheetTitle>Customer Support</SheetTitle>
                <SheetDescription>
                  Chat with our team for assistance
                </SheetDescription>
              </div>
              {!user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetGuestState}
                  className="text-xs"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Reset Chat
                </Button>
              )}
            </div>
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
                            // Clear any existing guest ID that might be invalid
                            if (guestUserId) {
                              console.log("Clearing existing guest ID for new guest user");
                              localStorage.removeItem('guestUserId');
                              localStorage.removeItem('guestSessionId');
                              setGuestUserId(null);
                              setSessionId(null);
                            }
                            
                            // Use the message input if it exists, otherwise use a default message
                            const message = messageInput.trim() 
                              ? messageInput
                              : "Hello, I'd like some information about your services.";
                              
                            createConversationMutation.mutate(message);
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