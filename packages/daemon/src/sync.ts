/**
 * Network Sync Manager
 * 
 * Coordinates synchronization between local storage, IPFS, and P2P network
 */

import { EventEmitter } from "events";
import { logger } from "./logger";
import { Libp2pNode, getLibp2pNode, ContentHash } from "./libp2p";
import { IPFSStorage, getIPFSStorage } from "./ipfs";
import { Storage, Post, Vote, Comment } from "./storage";

// ============================================
// TYPES
// ============================================

export interface SyncStats {
  lastSync: number | null;
  postsReceived: number;
  postsSent: number;
  votesReceived: number;
  votesSent: number;
  peersConnected: number;
  isOnline: boolean;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number;
  announceOnCreate: boolean;
  requestMissing: boolean;
}

const DEFAULT_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 60000, // 1 minute
  announceOnCreate: true,
  requestMissing: true,
};

// ============================================
// SYNC MANAGER
// ============================================

export class NetworkSyncManager extends EventEmitter {
  private config: SyncConfig;
  private node: Libp2pNode;
  private ipfs: IPFSStorage;
  private storage: Storage;
  private syncTimer: NodeJS.Timeout | null = null;
  private stats: SyncStats = {
    lastSync: null,
    postsReceived: 0,
    postsSent: 0,
    votesReceived: 0,
    votesSent: 0,
    peersConnected: 0,
    isOnline: false,
  };

  constructor(storage: Storage, config: Partial<SyncConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = storage;
    this.node = getLibp2pNode();
    this.ipfs = getIPFSStorage();
    
    this.setupHandlers();
  }

  /**
   * Start the sync manager
   */
  async start(): Promise<void> {
    logger.info("[Sync] Starting network sync manager");

    // Start libp2p node
    await this.node.start();

    // Subscribe to topics
    this.node.subscribe("iceberg/global/posts");
    this.node.subscribe("iceberg/global/votes");
    this.node.subscribe(`iceberg/BR/posts`);
    this.node.subscribe(`iceberg/BR/content`);

    this.stats.isOnline = true;

    // Start auto sync
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    this.emit("started");
    logger.info("[Sync] Network sync manager started");
  }

  /**
   * Stop the sync manager
   */
  async stop(): Promise<void> {
    this.stopAutoSync();
    await this.node.stop();
    this.stats.isOnline = false;
    this.emit("stopped");
  }

  /**
   * Announce a new post to the network
   */
  async announcePost(post: Post): Promise<void> {
    if (!this.stats.isOnline) {
      return;
    }

    logger.info({ cid: post.cid.slice(0, 16) }, "[Sync] Announcing post");

    // Store in IPFS
    const jsonCid = await this.ipfs.addJSON(post, { pin: true });

    // Announce to network
    const hash: ContentHash = {
      cid: post.cid,
      type: "post",
      timestamp: post.createdAt,
      author: post.author,
    };

    await this.node.announceContent(hash);
    this.stats.postsSent++;

    this.emit("post:announced", post);
  }

  /**
   * Announce a vote to the network
   */
  async announceVote(vote: Vote): Promise<void> {
    if (!this.stats.isOnline) {
      return;
    }

    // Store in IPFS
    await this.ipfs.addJSON(vote);

    // Publish to topic
    await this.node.publish("iceberg/global/votes", {
      type: "vote",
      vote,
    });

    this.stats.votesSent++;
    this.emit("vote:announced", vote);
  }

  /**
   * Request a post from the network
   */
  async requestPost(cid: string): Promise<Post | null> {
    logger.info({ cid: cid.slice(0, 16) }, "[Sync] Requesting post from network");

    // Check IPFS first
    const cached = await this.ipfs.getJSON<Post>(cid);
    if (cached) {
      return cached;
    }

    // Request from peers
    const content = await this.node.requestContent(cid);
    if (content) {
      // Store locally
      await this.ipfs.addJSON(content, { pin: false });
      this.stats.postsReceived++;
      return content as Post;
    }

    return null;
  }

  /**
   * Sync with the network
   */
  async syncNow(): Promise<{ received: number; sent: number }> {
    if (!this.stats.isOnline) {
      throw new Error("Not connected to network");
    }

    logger.info("[Sync] Starting network sync");

    const peers = this.node.getPeers();
    let totalReceived = 0;
    let totalSent = 0;

    // Sync with each peer
    for (const peer of peers.slice(0, 5)) {
      try {
        const result = await this.node.syncWithPeer(peer.id);
        totalReceived += result.received;
        totalSent += result.sent;
      } catch (error) {
        logger.warn({ peerId: peer.id.slice(0, 16) }, "[Sync] Peer sync failed");
      }
    }

    // Announce our recent posts
    const { posts } = this.storage.listPosts({ limit: 10 });
    for (const post of posts) {
      await this.announcePost(post);
    }

    this.stats.lastSync = Date.now();
    this.stats.peersConnected = peers.length;

    logger.info({ received: totalReceived, sent: totalSent }, "[Sync] Sync complete");

    return { received: totalReceived, sent: totalSent };
  }

  /**
   * Get sync stats
   */
  getStats(): SyncStats {
    this.stats.peersConnected = this.node.getPeers().length;
    return { ...this.stats };
  }

  /**
   * Get full network status
   */
  getNetworkStatus() {
    return {
      sync: this.getStats(),
      node: this.node.getStats(),
      ipfs: this.ipfs.getStats(),
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private setupHandlers(): void {
    // Handle incoming posts
    this.node.on("message:iceberg/global/posts", async (msg: any) => {
      if (msg.payload?.type === "post" && msg.payload?.post) {
        await this.handleIncomingPost(msg.payload.post);
      }
    });

    // Handle incoming votes
    this.node.on("message:iceberg/global/votes", async (msg: any) => {
      if (msg.payload?.type === "vote" && msg.payload?.vote) {
        await this.handleIncomingVote(msg.payload.vote);
      }
    });

    // Handle peer events
    this.node.on("peer:connect", (peer: any) => {
      this.stats.peersConnected++;
      this.emit("peer:connected", peer);
    });

    this.node.on("peer:disconnect", (peer: any) => {
      this.stats.peersConnected--;
      this.emit("peer:disconnected", peer);
    });
  }

  private async handleIncomingPost(post: Post): Promise<void> {
    // Check if we already have it
    const existing = this.storage.getPost(post.cid);
    if (existing) {
      return;
    }

    logger.info({ cid: post.cid.slice(0, 16) }, "[Sync] Received post from network");

    // Store in IPFS
    await this.ipfs.addJSON(post, { pin: false });

    // Store locally
    // Note: In production, would validate author signature first
    // this.storage.createPost(post);

    this.stats.postsReceived++;
    this.emit("post:received", post);
  }

  private async handleIncomingVote(vote: Vote): Promise<void> {
    logger.info({ postCid: vote.postCid.slice(0, 16) }, "[Sync] Received vote from network");

    this.stats.votesReceived++;
    this.emit("vote:received", vote);
  }

  private startAutoSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncNow().catch(error => {
        logger.error({ error }, "[Sync] Auto-sync failed");
      });
    }, this.config.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

// ============================================
// SINGLETON
// ============================================

let manager: NetworkSyncManager | null = null;

export function getNetworkSyncManager(storage: Storage, config?: Partial<SyncConfig>): NetworkSyncManager {
  if (!manager) {
    manager = new NetworkSyncManager(storage, config);
  }
  return manager;
}

export default NetworkSyncManager;
