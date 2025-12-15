/**
 * WebSocket Server for Real-time P2P Chat
 * 
 * Provides real-time messaging capabilities for the Iceberg Protocol.
 * Uses ws library for WebSocket connections.
 */

import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { Storage, ChatMessage } from "./storage";
import * as crypto from "crypto";

interface Client {
  ws: WebSocket;
  publicKey: string;
  lastPing: number;
}

interface WSMessage {
  type: "auth" | "message" | "typing" | "read" | "ping" | "pong";
  to?: string;
  content?: string;
  messageId?: string;
  publicKey?: string;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private storage: Storage;

  constructor(port: number, storage: Storage) {
    this.storage = storage;
    this.wss = new WebSocketServer({ port });

    console.log(`🔌 WebSocket Chat server running on port ${port}`);

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    // Ping interval to keep connections alive
    setInterval(() => this.pingClients(), 30000);
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    let clientPublicKey: string | null = null;

    ws.on("message", (data: Buffer) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());
        
        switch (msg.type) {
          case "auth":
            clientPublicKey = this.handleAuth(ws, msg.publicKey);
            break;
          
          case "message":
            if (clientPublicKey && msg.to && msg.content) {
              this.handleMessage(clientPublicKey, msg.to, msg.content);
            }
            break;
          
          case "typing":
            if (clientPublicKey && msg.to) {
              this.handleTyping(clientPublicKey, msg.to);
            }
            break;
          
          case "read":
            if (clientPublicKey && msg.to) {
              this.handleRead(clientPublicKey, msg.to);
            }
            break;
          
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (clientPublicKey) {
        this.clients.delete(clientPublicKey);
        console.log(`Client disconnected: ${clientPublicKey.slice(0, 8)}...`);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  private handleAuth(ws: WebSocket, publicKey?: string): string | null {
    if (!publicKey) {
      ws.send(JSON.stringify({ type: "error", message: "Public key required" }));
      return null;
    }

    // Store client connection
    this.clients.set(publicKey, {
      ws,
      publicKey,
      lastPing: Date.now()
    });

    // Send auth success
    ws.send(JSON.stringify({ 
      type: "auth_success", 
      publicKey,
      message: "Connected to Iceberg Chat"
    }));

    // Send unread message count
    const conversations = this.storage.getConversations(publicKey);
    const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);
    
    ws.send(JSON.stringify({
      type: "unread_count",
      count: unreadTotal
    }));

    console.log(`Client authenticated: ${publicKey.slice(0, 8)}...`);
    return publicKey;
  }

  private handleMessage(from: string, to: string, content: string) {
    // Generate message ID
    const messageId = crypto.randomBytes(16).toString("hex");
    
    // Save to storage
    const message: ChatMessage = {
      id: messageId,
      fromPubKey: from,
      toPubKey: to,
      content,
      createdAt: Date.now(),
      read: false
    };
    
    this.storage.saveMessage(message);

    // Send to recipient if online
    const recipient = this.clients.get(to);
    if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
      recipient.ws.send(JSON.stringify({
        type: "new_message",
        message: {
          id: messageId,
          from,
          content,
          createdAt: message.createdAt
        }
      }));
    }

    // Confirm to sender
    const sender = this.clients.get(from);
    if (sender && sender.ws.readyState === WebSocket.OPEN) {
      sender.ws.send(JSON.stringify({
        type: "message_sent",
        messageId,
        to,
        createdAt: message.createdAt
      }));
    }
  }

  private handleTyping(from: string, to: string) {
    const recipient = this.clients.get(to);
    if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
      recipient.ws.send(JSON.stringify({
        type: "typing",
        from
      }));
    }
  }

  private handleRead(from: string, messageFrom: string) {
    // Mark messages as read in storage
    this.storage.markMessagesAsRead(from, messageFrom);

    // Notify the other party
    const otherParty = this.clients.get(messageFrom);
    if (otherParty && otherParty.ws.readyState === WebSocket.OPEN) {
      otherParty.ws.send(JSON.stringify({
        type: "messages_read",
        by: from
      }));
    }
  }

  private pingClients() {
    const now = Date.now();
    
    this.clients.forEach((client, publicKey) => {
      if (now - client.lastPing > 60000) {
        // Client hasn't responded in 60 seconds
        client.ws.terminate();
        this.clients.delete(publicKey);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: "ping" }));
        client.lastPing = now;
      }
    });
  }

  public broadcast(message: any, excludeKey?: string) {
    const data = JSON.stringify(message);
    
    this.clients.forEach((client, publicKey) => {
      if (publicKey !== excludeKey && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public isUserOnline(publicKey: string): boolean {
    const client = this.clients.get(publicKey);
    return client !== undefined && client.ws.readyState === WebSocket.OPEN;
  }

  public close() {
    this.wss.close();
  }
}

// Start WebSocket server if running standalone
export function startChatServer(storage: Storage, port = 8421): ChatWebSocketServer {
  return new ChatWebSocketServer(port, storage);
}
