import { io, Socket } from "socket.io-client";

// Types for message and typing events
interface TypingIndicator {
  conversationId: number;
  userId: number;
  userType: string;
  isTyping: boolean;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: string;
  content: string;
  messageType: string;
  createdAt: string;
  [key: string]: any;
}

// Socket.io client instance
let socket: Socket | null = null;

// Initialize the socket connection
export const initializeSocket = (): Socket => {
  if (!socket) {
    // Determine the proper socket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    
    // Create the socket connection
    socket = io(wsUrl, { 
      path: "/ws",
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Setup default listeners
    socket.on("connect", () => {
      console.log("Socket.IO connected");
    });
    
    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });
  }
  
  return socket;
};

// Join a conversation room
export const joinConversation = (conversationId: number): void => {
  const socketInstance = initializeSocket();
  if (socketInstance && conversationId) {
    console.log(`Joining conversation: ${conversationId}`);
    socketInstance.emit("join-conversation", conversationId);
  }
};

// Leave a conversation room
export const leaveConversation = (conversationId: number): void => {
  if (socket && conversationId) {
    console.log(`Leaving conversation: ${conversationId}`);
    socket.emit("leave-conversation", conversationId);
  }
};

// Send typing indicator
export const sendTypingIndicator = (
  conversationId: number, 
  userId: number, 
  userType: string, 
  isTyping: boolean
): void => {
  const socketInstance = initializeSocket();
  if (socketInstance && conversationId) {
    if (isTyping) {
      socketInstance.emit("typing-start", { conversationId, userId, userType });
    } else {
      socketInstance.emit("typing-stop", { conversationId, userId, userType });
    }
  }
};

// Send new message notification
export const sendNewMessageNotification = (message: Message): void => {
  const socketInstance = initializeSocket();
  if (socketInstance && message.conversationId) {
    socketInstance.emit("new-message", message);
  }
};

// Subscribe to user typing events
export const subscribeToTypingIndicators = (
  callback: (data: TypingIndicator) => void
): void => {
  const socketInstance = initializeSocket();
  socketInstance.on("user-typing", callback);
};

// Subscribe to new message events
export const subscribeToNewMessages = (
  callback: (message: Message) => void
): void => {
  const socketInstance = initializeSocket();
  socketInstance.on("message-received", callback);
};

// Unsubscribe from events
export const unsubscribeFromEvent = (event: string): void => {
  if (socket) {
    socket.off(event);
  }
};

// Disconnect the socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};