import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Post {
  cid: string;
  title: string;
  body: string;
  author: string;
  region: string;
  category?: string;
  level: number;
  createdAt: number;
  updatedAt: number;
  votes?: {
    up: number;
    down: number;
    reports: number;
    score: number;
  };
}

export interface Identity {
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

interface StoreState {
  identity: Identity | null;
  setIdentity: (identity: Identity | null) => void;
  region: string;
  setRegion: (region: string) => void;
  level: number;
  setLevel: (level: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      identity: null,
      setIdentity: (identity) => set({ identity }),
      region: "",
      setRegion: (region) => set({ region }),
      level: 0,
      setLevel: (level) => set({ level }),
    }),
    { name: "iceberg-store" }
  )
);

// API Helper
const API_URL = typeof window !== "undefined" ? "/api" : "http://localhost:8420";
const DAEMON_URL = "http://localhost:8420";

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${DAEMON_URL}/health`);
      return res.json();
    } catch (error) {
      return { status: "offline", version: "?", uptime: 0, peers: 0, postsCount: 0, commentsCount: 0, votesCount: 0 };
    }
  },

  async getNetworkPeers() {
    try {
      const res = await fetch(`${DAEMON_URL}/network/peers`);
      return res.json();
    } catch (error) {
      return { count: 0, peers: [] };
    }
  },

  async health() {
    const res = await fetch(`${API_URL}/health`);
    return res.json();
  },

  async getIdentity() {
    const res = await fetch(`${API_URL}/identity`);
    if (!res.ok) throw new Error("Nenhuma identidade");
    return res.json();
  },

  async createIdentity(force = false) {
    const res = await fetch(`${API_URL}/identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    return res.json();
  },

  async getUserComments(pubkey: string, limit = 50, offset = 0) {
    const res = await fetch(`${API_URL}/identity/${pubkey}/comments?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async getUserVotes(pubkey: string, limit = 50, offset = 0) {
    const res = await fetch(`${API_URL}/identity/${pubkey}/votes?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async getPosts(options?: { region?: string; level?: number; author?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.region) params.append("region", options.region);
    if (options?.level !== undefined) params.append("level", options.level.toString());
    if (options?.author) params.append("author", options.author);
    if (options?.limit) params.append("limit", options.limit.toString());
    const res = await fetch(`${API_URL}/posts?${params}`);
    return res.json();
  },

  async getPost(cid: string) {
    const res = await fetch(`${API_URL}/posts/${cid}`);
    if (!res.ok) throw new Error("Post não encontrado");
    return res.json();
  },

  async createPost(data: { title: string; body: string; region: string; category?: string }) {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async vote(cid: string, type: "up" | "down" | "report") {
    const res = await fetch(`${API_URL}/votes/${cid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    return res.json();
  },

  // ==========================================
  // COMMENTS
  // ==========================================

  async getComments(postCid: string) {
    const res = await fetch(`${API_URL}/posts/${postCid}/comments`);
    return res.json();
  },

  async createComment(postCid: string, body: string, parentCid?: string) {
    const res = await fetch(`${API_URL}/posts/${postCid}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, parentCid }),
    });
    return res.json();
  },

  async deleteComment(cid: string) {
    const res = await fetch(`${API_URL}/comments/${cid}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // ==========================================
  // REPORTS
  // ==========================================

  async createReport(targetCid: string, targetType: "post" | "comment", reason: string) {
    const res = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCid, targetType, reason }),
    });
    return res.json();
  },

  async getReports(status?: string) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const res = await fetch(`${API_URL}/reports?${params}`);
    return res.json();
  },

  // ==========================================
  // CHAT
  // ==========================================

  async getConversations() {
    const res = await fetch(`${API_URL}/chat/conversations`);
    return res.json();
  },

  async getMessages(peerPubKey: string, limit = 100) {
    const res = await fetch(`${API_URL}/chat/${peerPubKey}?limit=${limit}`);
    return res.json();
  },

  async sendMessage(peerPubKey: string, content: string) {
    const res = await fetch(`${API_URL}/chat/${peerPubKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },

  // ==========================================
  // BITCOIN
  // ==========================================

  async getBitcoinAddress() {
    const res = await fetch(`${API_URL}/bitcoin/address`);
    return res.json();
  },

  async setBtcAddress(address: string) {
    const res = await fetch(`${API_URL}/bitcoin/address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    return res.json();
  },

  async validateBtcAddress(address: string) {
    const res = await fetch(`${API_URL}/bitcoin/validate/${address}`);
    return res.json();
  },

  async createBounty(postCid: string, amount: number, label?: string) {
    const res = await fetch(`${API_URL}/bitcoin/bounty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postCid, amount, label }),
    });
    return res.json();
  },

  // ==========================================
  // HASHTAGS
  // ==========================================

  async getTrendingHashtags(limit = 10) {
    const res = await fetch(`${API_URL}/hashtags/trending?limit=${limit}`);
    return res.json();
  },

  async getPostsByHashtag(tag: string, limit = 50, offset = 0) {
    const res = await fetch(`${API_URL}/hashtags/${tag}?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async getRelatedPosts(postCid: string, hashtags: string[], limit = 10) {
    const params = new URLSearchParams();
    params.append("postCid", postCid);
    params.append("hashtags", hashtags.join(","));
    params.append("limit", limit.toString());
    const res = await fetch(`${API_URL}/hashtags/related?${params}`);
    return res.json();
  },

  // ==========================================
  // SAVED POSTS
  // ==========================================

  async getSavedPosts(limit = 50, offset = 0) {
    const res = await fetch(`${API_URL}/saved?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async savePost(cid: string) {
    const res = await fetch(`${API_URL}/saved/${cid}`, {
      method: "POST",
    });
    return res.json();
  },

  async unsavePost(cid: string) {
    const res = await fetch(`${API_URL}/saved/${cid}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async isPostSaved(cid: string) {
    const res = await fetch(`${API_URL}/saved/${cid}/status`);
    return res.json();
  },

  // ==========================================
  // SCHEDULED POSTS
  // ==========================================

  async getScheduledPosts() {
    const res = await fetch(`${API_URL}/scheduled`);
    return res.json();
  },

  async createScheduledPost(data: {
    title: string;
    body: string;
    region: string;
    category?: string;
    publishAt: number;
    endPostAfterDays?: number;
  }) {
    const res = await fetch(`${API_URL}/scheduled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async cancelScheduledPost(id: string) {
    const res = await fetch(`${API_URL}/scheduled/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async publishScheduledPostNow(id: string) {
    const res = await fetch(`${API_URL}/scheduled/${id}/publish`, {
      method: "POST",
    });
    return res.json();
  },

  async getScheduledPost(id: string) {
    const res = await fetch(`${API_URL}/scheduled/${id}`);
    return res.json();
  },

  async updateScheduledPost(id: string, data: {
    title?: string;
    body?: string;
    region?: string;
    category?: string;
    publishAt?: number;
  }) {
    const res = await fetch(`${API_URL}/scheduled/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ==========================================
  // COMMENT VOTES
  // ==========================================

  async voteComment(cid: string, type: "up" | "down") {
    const res = await fetch(`${API_URL}/comments/${cid}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    return res.json();
  },

  async getCommentVotes(cid: string) {
    const res = await fetch(`${API_URL}/comments/${cid}/votes`);
    return res.json();
  },

  // ==========================================
  // SYSTEM MODE & CONFIG
  // ==========================================

  async getSystemMode() {
    try {
      const res = await fetch(`${DAEMON_URL}/system/mode`);
      return res.json();
    } catch {
      return { mode: "online", isLocal: false, canConfigure: false };
    }
  },

  async getSystemInfo() {
    try {
      const res = await fetch(`${DAEMON_URL}/system/info`);
      return res.json();
    } catch {
      return null;
    }
  },

  async getSystemLimits() {
    try {
      const res = await fetch(`${DAEMON_URL}/system/limits`);
      return res.json();
    } catch {
      return null;
    }
  },

  async getSystemConfig() {
    try {
      const res = await fetch(`${DAEMON_URL}/system/config`);
      if (res.ok) return res.json();
      return null;
    } catch {
      return null;
    }
  },

  async updateSystemConfig(config: Record<string, any>) {
    const res = await fetch(`${DAEMON_URL}/system/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async exportSystemData() {
    const res = await fetch(`${DAEMON_URL}/system/export`, {
      method: "POST",
    });
    return res.json();
  },

  async clearSystemCache() {
    const res = await fetch(`${DAEMON_URL}/system/clear-cache`, {
      method: "POST",
    });
    return res.json();
  },

  async getSystemFeatures() {
    try {
      const res = await fetch(`${DAEMON_URL}/system/features`);
      return res.json();
    } catch {
      return { mode: "online", features: [] };
    }
  },
};

