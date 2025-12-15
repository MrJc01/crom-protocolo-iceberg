/**
 * IPFS Storage Adapter
 * 
 * Provides content-addressable storage using IPFS
 */

import { createHash } from "crypto";
import { logger } from "./logger";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ============================================
// TYPES
// ============================================

export interface IPFSObject {
  cid: string;
  data: Buffer | string;
  size: number;
  links: string[];
  pinned: boolean;
  createdAt: number;
}

export interface IPFSConfig {
  repoPath: string;
  maxStorageBytes: number;
  gcInterval: number;
}

const DEFAULT_CONFIG: IPFSConfig = {
  repoPath: path.join(os.homedir(), ".iceberg", "ipfs"),
  maxStorageBytes: 1024 * 1024 * 1024, // 1GB
  gcInterval: 3600000, // 1 hour
};

// ============================================
// CID GENERATION
// ============================================

/**
 * Generate CID v1 style content identifier
 */
function generateCID(data: Buffer | string): string {
  const buffer = typeof data === "string" ? Buffer.from(data) : data;
  const hash = createHash("sha256").update(buffer).digest("hex");
  // CIDv1 format: base32 encoded multihash
  return `baf${hash.slice(0, 56)}`;
}

// ============================================
// IPFS STORAGE
// ============================================

/**
 * Local IPFS-like Storage
 * 
 * Implements content-addressable storage with:
 * - Content deduplication
 * - Pinning
 * - Garbage collection
 * - Size limits
 */
export class IPFSStorage {
  private config: IPFSConfig;
  private objects: Map<string, IPFSObject> = new Map();
  private pinnedCIDs: Set<string> = new Set();
  private gcTimer: NodeJS.Timeout | null = null;
  private totalSize: number = 0;

  constructor(config: Partial<IPFSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  private init(): void {
    // Create repo directory
    if (!fs.existsSync(this.config.repoPath)) {
      fs.mkdirSync(this.config.repoPath, { recursive: true });
    }

    // Load existing objects
    this.loadFromDisk();

    // Start GC
    this.startGC();

    logger.info({ repoPath: this.config.repoPath }, "[IPFS] Storage initialized");
  }

  /**
   * Add content to IPFS
   */
  async add(data: Buffer | string, options: { pin?: boolean } = {}): Promise<string> {
    const buffer = typeof data === "string" ? Buffer.from(data) : data;
    const cid = generateCID(buffer);

    // Check if already exists
    if (this.objects.has(cid)) {
      if (options.pin) {
        this.pinnedCIDs.add(cid);
      }
      return cid;
    }

    // Check storage limit
    if (this.totalSize + buffer.length > this.config.maxStorageBytes) {
      await this.collectGarbage();
      
      if (this.totalSize + buffer.length > this.config.maxStorageBytes) {
        throw new Error("Storage limit exceeded");
      }
    }

    const obj: IPFSObject = {
      cid,
      data: buffer,
      size: buffer.length,
      links: [],
      pinned: options.pin || false,
      createdAt: Date.now(),
    };

    this.objects.set(cid, obj);
    this.totalSize += buffer.length;

    if (options.pin) {
      this.pinnedCIDs.add(cid);
    }

    // Persist to disk
    this.saveToDisk(cid, obj);

    logger.info({ cid: cid.slice(0, 16), size: buffer.length }, "[IPFS] Content added");

    return cid;
  }

  /**
   * Add JSON content
   */
  async addJSON(obj: any, options: { pin?: boolean } = {}): Promise<string> {
    const json = JSON.stringify(obj);
    return this.add(json, options);
  }

  /**
   * Get content by CID
   */
  async get(cid: string): Promise<Buffer | null> {
    const obj = this.objects.get(cid);
    if (!obj) {
      return null;
    }

    return typeof obj.data === "string" ? Buffer.from(obj.data) : obj.data;
  }

  /**
   * Get JSON content by CID
   */
  async getJSON<T = any>(cid: string): Promise<T | null> {
    const buffer = await this.get(cid);
    if (!buffer) {
      return null;
    }

    try {
      return JSON.parse(buffer.toString());
    } catch {
      return null;
    }
  }

  /**
   * Check if CID exists
   */
  has(cid: string): boolean {
    return this.objects.has(cid);
  }

  /**
   * Pin content (prevent GC)
   */
  pin(cid: string): boolean {
    if (!this.objects.has(cid)) {
      return false;
    }

    this.pinnedCIDs.add(cid);
    const obj = this.objects.get(cid)!;
    obj.pinned = true;

    return true;
  }

  /**
   * Unpin content
   */
  unpin(cid: string): boolean {
    if (!this.pinnedCIDs.has(cid)) {
      return false;
    }

    this.pinnedCIDs.delete(cid);
    const obj = this.objects.get(cid);
    if (obj) {
      obj.pinned = false;
    }

    return true;
  }

  /**
   * Remove content
   */
  async remove(cid: string): Promise<boolean> {
    const obj = this.objects.get(cid);
    if (!obj) {
      return false;
    }

    if (obj.pinned) {
      return false; // Cannot remove pinned content
    }

    this.objects.delete(cid);
    this.totalSize -= obj.size;

    // Remove from disk
    const filePath = path.join(this.config.repoPath, `${cid}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return true;
  }

  /**
   * Get storage stats
   */
  getStats() {
    return {
      objectCount: this.objects.size,
      pinnedCount: this.pinnedCIDs.size,
      totalSize: this.totalSize,
      maxSize: this.config.maxStorageBytes,
      usagePercent: Math.round((this.totalSize / this.config.maxStorageBytes) * 100),
    };
  }

  /**
   * List all CIDs
   */
  list(options: { pinned?: boolean; limit?: number } = {}): string[] {
    let cids = Array.from(this.objects.keys());

    if (options.pinned !== undefined) {
      cids = cids.filter(cid => this.pinnedCIDs.has(cid) === options.pinned);
    }

    if (options.limit) {
      cids = cids.slice(0, options.limit);
    }

    return cids;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private loadFromDisk(): void {
    try {
      const files = fs.readdirSync(this.config.repoPath);
      
      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = path.join(this.config.repoPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const obj: IPFSObject = JSON.parse(content);

        this.objects.set(obj.cid, obj);
        this.totalSize += obj.size;

        if (obj.pinned) {
          this.pinnedCIDs.add(obj.cid);
        }
      }

      logger.info({ objectCount: this.objects.size }, "[IPFS] Loaded from disk");
    } catch (error) {
      // Ignore errors on first run
    }
  }

  private saveToDisk(cid: string, obj: IPFSObject): void {
    const filePath = path.join(this.config.repoPath, `${cid}.json`);
    const toSave = { ...obj, data: obj.data.toString("base64") };
    fs.writeFileSync(filePath, JSON.stringify(toSave));
  }

  private startGC(): void {
    this.gcTimer = setInterval(() => {
      this.collectGarbage();
    }, this.config.gcInterval);
  }

  private async collectGarbage(): Promise<number> {
    const target = this.config.maxStorageBytes * 0.8; // Keep 80% max
    
    if (this.totalSize <= target) {
      return 0;
    }

    logger.info("[IPFS] Running garbage collection");

    // Get unpinned objects sorted by age
    const unpinned = Array.from(this.objects.entries())
      .filter(([cid]) => !this.pinnedCIDs.has(cid))
      .sort((a, b) => a[1].createdAt - b[1].createdAt);

    let removed = 0;
    for (const [cid] of unpinned) {
      if (this.totalSize <= target) break;

      await this.remove(cid);
      removed++;
    }

    logger.info({ removed }, "[IPFS] Garbage collection complete");
    return removed;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
  }
}

// ============================================
// SINGLETON
// ============================================

let storage: IPFSStorage | null = null;

export function getIPFSStorage(config?: Partial<IPFSConfig>): IPFSStorage {
  if (!storage) {
    storage = new IPFSStorage(config);
  }
  return storage;
}

export default IPFSStorage;
