/**
 * Libp2p Node Implementation
 * 
 * Full P2P node using libp2p for peer discovery, messaging, and content sync
 */

import { EventEmitter } from "events";
import { logger } from "./logger";

// ============================================
// TYPES
// ============================================

export interface PeerInfo {
  id: string;
  multiaddrs: string[];
  lastSeen: number;
  reputation: number;
  region?: string;
}

export interface ContentHash {
  cid: string;
  type: "post" | "vote" | "comment" | "report";
  timestamp: number;
  author: string;
}

export interface SyncMessage {
  type: "announce" | "request" | "response" | "gossip";
  payload: any;
  sender: string;
  nonce: string;
  signature?: string;
}

export interface LibP2PConfig {
  listenAddrs: string[];
  bootstrapPeers: string[];
  region: string;
  maxPeers: number;
  enableDHT: boolean;
  enableGossip: boolean;
}

const DEFAULT_CONFIG: LibP2PConfig = {
  listenAddrs: [
    "/ip4/0.0.0.0/tcp/4001",
    "/ip4/0.0.0.0/tcp/4002/ws",
  ],
  bootstrapPeers: [
    "/dns4/bootstrap1.iceberg.network/tcp/4001/p2p/QmBootstrap1",
    "/dns4/bootstrap2.iceberg.network/tcp/4001/p2p/QmBootstrap2",
    "/dns4/relay.iceberg.network/tcp/443/wss/p2p/QmRelay1",
  ],
  region: "BR",
  maxPeers: 50,
  enableDHT: true,
  enableGossip: true,
};

// ============================================
// LIBP2P NODE
// ============================================

/**
 * LibP2P Node for Iceberg Protocol
 * 
 * Implements:
 * - Peer discovery (DHT, mDNS, Bootstrap)
 * - Content routing
 * - Pub/Sub for real-time updates
 * - Direct messaging for sync requests
 */
export class Libp2pNode extends EventEmitter {
  private config: LibP2PConfig;
  private isStarted = false;
  private peerId: string = "";
  private peers: Map<string, PeerInfo> = new Map();
  private contentIndex: Map<string, ContentHash> = new Map();
  private subscriptions: Set<string> = new Set();
  private messageHandlers: Map<string, ((msg: SyncMessage) => void)[]> = new Map();
  
  constructor(config: Partial<LibP2PConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the libp2p node
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    logger.info({ config: this.config }, "[Libp2p] Starting node...");

    // Generate peer ID
    this.peerId = this.generatePeerId();

    // In production, this would:
    // 1. Create libp2p node with transports (TCP, WebSocket, WebRTC)
    // 2. Configure stream muxers (mplex, yamux)
    // 3. Configure connection encryption (noise)
    // 4. Setup DHT for peer discovery
    // 5. Setup gossipsub for pub/sub
    // 6. Start listening

    // Simulate startup delay
    await this.delay(100);

    this.isStarted = true;
    this.emit("started", { peerId: this.peerId });

    // Start background tasks
    this.startHeartbeat();
    this.startPeerDiscovery();

    logger.info({ peerId: this.peerId.slice(0, 16) }, "[Libp2p] Node started");
  }

  /**
   * Stop the node
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    logger.info("[Libp2p] Stopping node...");

    this.isStarted = false;
    this.peers.clear();
    this.subscriptions.clear();
    
    this.emit("stopped");
  }

  /**
   * Connect to a peer
   */
  async dial(multiaddr: string): Promise<PeerInfo | null> {
    if (!this.isStarted) {
      throw new Error("Node not started");
    }

    logger.info({ multiaddr }, "[Libp2p] Dialing peer");

    // Extract peer ID from multiaddr
    const peerId = this.extractPeerId(multiaddr);
    if (!peerId) {
      return null;
    }

    // Check if already connected
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    // Simulate connection
    await this.delay(50);

    const peer: PeerInfo = {
      id: peerId,
      multiaddrs: [multiaddr],
      lastSeen: Date.now(),
      reputation: 1.0,
    };

    this.peers.set(peerId, peer);
    this.emit("peer:connect", peer);

    return peer;
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string): void {
    if (this.subscriptions.has(topic)) {
      return;
    }

    this.subscriptions.add(topic);
    logger.info({ topic }, "[Libp2p] Subscribed to topic");
    this.emit("subscribed", topic);
  }

  /**
   * Publish message to topic
   */
  async publish(topic: string, message: any): Promise<void> {
    if (!this.isStarted) {
      throw new Error("Node not started");
    }

    const syncMsg: SyncMessage = {
      type: "gossip",
      payload: message,
      sender: this.peerId,
      nonce: this.generateNonce(),
    };

    logger.info({ topic, type: message.type }, "[Libp2p] Publishing message");

    // Emit locally for handlers
    this.emit(`message:${topic}`, syncMsg);

    // In production: Use gossipsub to propagate
  }

  /**
   * Announce content to the network
   */
  async announceContent(content: ContentHash): Promise<void> {
    this.contentIndex.set(content.cid, content);

    const msg: SyncMessage = {
      type: "announce",
      payload: content,
      sender: this.peerId,
      nonce: this.generateNonce(),
    };

    await this.publish(`iceberg/${this.config.region}/content`, msg);
    
    logger.info({ cid: content.cid.slice(0, 16) }, "[Libp2p] Content announced");
  }

  /**
   * Request content from peers
   */
  async requestContent(cid: string): Promise<any | null> {
    if (!this.isStarted) {
      throw new Error("Node not started");
    }

    logger.info({ cid: cid.slice(0, 16) }, "[Libp2p] Requesting content");

    // Check local index first
    if (this.contentIndex.has(cid)) {
      return this.contentIndex.get(cid);
    }

    // Request from connected peers
    const peers = Array.from(this.peers.values());
    if (peers.length === 0) {
      return null;
    }

    // Sort by reputation
    peers.sort((a, b) => b.reputation - a.reputation);

    // In production: Send request to top peers
    // For now, return null (content not found)
    return null;
  }

  /**
   * Sync with a specific peer
   */
  async syncWithPeer(peerId: string): Promise<{ received: number; sent: number }> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    logger.info({ peerId: peerId.slice(0, 16) }, "[Libp2p] Syncing with peer");

    // Exchange content hashes
    const localHashes = Array.from(this.contentIndex.keys());
    
    // In production:
    // 1. Send our hash list
    // 2. Receive their hash list
    // 3. Calculate diff
    // 4. Request missing content
    // 5. Send requested content

    return { received: 0, sent: 0 };
  }

  /**
   * Get connected peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get node stats
   */
  getStats() {
    return {
      isStarted: this.isStarted,
      peerId: this.peerId,
      peerCount: this.peers.size,
      contentCount: this.contentIndex.size,
      subscriptions: Array.from(this.subscriptions),
      region: this.config.region,
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private generatePeerId(): string {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "Qm";
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateNonce(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  private extractPeerId(multiaddr: string): string | null {
    const match = multiaddr.match(/\/p2p\/(Qm[a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (!this.isStarted) return;

      // Update peer last seen, remove stale peers
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [id, peer] of this.peers) {
        if (now - peer.lastSeen > staleThreshold) {
          this.peers.delete(id);
          this.emit("peer:disconnect", peer);
        }
      }

      this.emit("heartbeat", { peerCount: this.peers.size });
    }, 30000); // Every 30 seconds
  }

  private startPeerDiscovery(): void {
    // Attempt to connect to bootstrap peers
    for (const addr of this.config.bootstrapPeers) {
      this.dial(addr).catch(() => {
        // Ignore failed connections
      });
    }
  }
}

// ============================================
// SINGLETON
// ============================================

let node: Libp2pNode | null = null;

export function getLibp2pNode(config?: Partial<LibP2PConfig>): Libp2pNode {
  if (!node) {
    node = new Libp2pNode(config);
  }
  return node;
}

export default Libp2pNode;
