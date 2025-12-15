/**
 * useChat Hook - WebSocket Real-time Chat
 * 
 * Provides real-time messaging capabilities for the frontend.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "./store";

interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  content: string;
  createdAt: number;
  isMine?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  unreadCount: number;
  send: (content: string) => void;
  markAsRead: () => void;
  setTyping: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8421";

export function useChat(recipientPubKey?: string): UseChatReturn {
  const { identity } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Connect to WebSocket
  useEffect(() => {
    if (!identity?.publicKey) return;

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Chat WebSocket connected");
          // Authenticate
          ws.send(JSON.stringify({
            type: "auth",
            publicKey: identity.publicKey
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleMessage(data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        ws.onclose = () => {
          console.log("Chat WebSocket disconnected");
          setIsConnected(false);
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error("Chat WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [identity?.publicKey]);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case "auth_success":
        setIsConnected(true);
        break;
      
      case "unread_count":
        setUnreadCount(data.count);
        break;
      
      case "new_message":
        if (!recipientPubKey || data.message.from === recipientPubKey) {
          setMessages(prev => [...prev, {
            id: data.message.id,
            from: data.message.from,
            content: data.message.content,
            createdAt: data.message.createdAt,
            isMine: false
          }]);
          setUnreadCount(prev => prev + 1);
        }
        break;
      
      case "message_sent":
        // Message was successfully sent
        break;
      
      case "typing":
        if (data.from === recipientPubKey) {
          setIsTyping(true);
          // Clear typing indicator after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
        break;
      
      case "messages_read":
        // Other party read our messages
        break;
      
      case "ping":
        wsRef.current?.send(JSON.stringify({ type: "pong" }));
        break;
    }
  }, [recipientPubKey]);

  // Send message
  const send = useCallback((content: string) => {
    if (!wsRef.current || !recipientPubKey || !identity?.publicKey) return;
    
    const message = {
      type: "message",
      to: recipientPubKey,
      content
    };
    
    wsRef.current.send(JSON.stringify(message));
    
    // Optimistically add to messages
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      from: identity.publicKey,
      to: recipientPubKey,
      content,
      createdAt: Date.now(),
      isMine: true
    }]);
  }, [recipientPubKey, identity?.publicKey]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!wsRef.current || !recipientPubKey) return;
    
    wsRef.current.send(JSON.stringify({
      type: "read",
      to: recipientPubKey
    }));
    
    setUnreadCount(0);
  }, [recipientPubKey]);

  // Send typing indicator
  const setTypingIndicator = useCallback(() => {
    if (!wsRef.current || !recipientPubKey) return;
    
    wsRef.current.send(JSON.stringify({
      type: "typing",
      to: recipientPubKey
    }));
  }, [recipientPubKey]);

  return {
    messages,
    isConnected,
    isTyping,
    unreadCount,
    send,
    markAsRead,
    setTyping: setTypingIndicator
  };
}

// Global unread count hook
export function useChatUnread(): number {
  const { identity } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!identity?.publicKey) return;

    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "auth",
        publicKey: identity.publicKey
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "unread_count") {
          setUnreadCount(data.count);
        } else if (data.type === "new_message") {
          setUnreadCount(prev => prev + 1);
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, [identity?.publicKey]);

  return unreadCount;
}
