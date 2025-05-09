import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Search, MessageCircle, MessagesSquare, Send } from "lucide-react";
import { format, isValid } from "date-fns";

// Format date safely
const formatDate = (dateString: string | null | undefined, formatStr: string = "MMM d, h:mm a"): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, formatStr);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Error";
  }
};

// Message and conversation types from schema
type User = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type GuestUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  sessionId: string;
};

type Conversation = {
  id: number;
  userId: number | null;
  guestUserId: number | null;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  user?: User;
  guestUser?: GuestUser;
};

type Message = {
  id: number;
  conversationId: number;
  body: string;
  type: string;
  sentAt: string;
  readAt: string | null;
};

export default function AdminMessages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Use direct database access to fetch conversations with user data
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery<Conversation[]>({
    queryKey: ["/api/direct/conversations"],
  });

  // Get messages for selected conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await fetch(`/api/messages?conversationId=${selectedConversation.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/messages`, {
        conversationId: conversationId,
        message: message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/messages", selectedConversation?.id] });
      setMessageInput("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mark conversation as read by admin
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/read-admin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct/conversations"] });
    },
  });

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unreadByAdmin) {
      markAsReadMutation.mutate(conversation.id);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      message: messageInput,
    });
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(
        (conv) =>
          (conv.subject && conv.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (conv.user && 
            ((conv.user.firstName + " " + conv.user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) || 
             conv.user.email.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          (conv.guestUser && 
            (conv.guestUser.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             conv.guestUser.email.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : conversations;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle>Conversations</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {conversationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : conversationsError ? (
                  <div className="text-center py-4 text-destructive">
                    Failed to load conversations
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessagesSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        } ${conversation.unreadByAdmin ? "border-l-4 border-primary" : ""}`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {conversation.user
                                ? `${conversation.user.firstName} ${conversation.user.lastName}`
                                : conversation.guestUser
                                ? conversation.guestUser.name
                                : "Unknown User"}
                            </h3>
                            <p className="text-sm truncate">
                              {conversation.subject || "No subject"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs whitespace-nowrap">
                              {formatDate(conversation.lastMessageAt || conversation.createdAt)}
                            </span>
                            {conversation.unreadByAdmin && (
                              <Badge className="mt-1">New</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs">
                            {conversation.user
                              ? conversation.user.email
                              : conversation.guestUser
                              ? conversation.guestUser.email
                              : ""}
                          </span>
                          <Badge
                            variant={conversation.status === "open" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Messages View */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle>
                  {selectedConversation ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <span>
                          {selectedConversation.user
                            ? `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                            : selectedConversation.guestUser
                            ? selectedConversation.guestUser.name
                            : "Unknown User"}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.subject || "No subject"}
                        </p>
                      </div>
                      <Badge
                        variant={selectedConversation.status === "open" ? "default" : "secondary"}
                      >
                        {selectedConversation.status}
                      </Badge>
                    </div>
                  ) : (
                    "Select a conversation"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto pb-4">
                {selectedConversation ? (
                  messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messagesError ? (
                    <div className="text-center py-4 text-destructive">
                      Failed to load messages
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No messages in this conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isAdmin = message.type === "admin";
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] p-3 rounded-lg ${
                                isAdmin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.body}</p>
                              <p className="text-xs mt-1 text-right">
                                {formatDate(message.sentAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-medium">Select a conversation</p>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to view messages
                    </p>
                  </div>
                )}
              </CardContent>
              {selectedConversation && selectedConversation.status === "open" && (
                <div className="p-3 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      className="self-end"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}