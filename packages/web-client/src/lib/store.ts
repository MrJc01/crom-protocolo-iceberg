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

export const api = {
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

  async setBtcAddress(btcAddress: string) {
    const res = await fetch(`${API_URL}/identity/btc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ btcAddress }),
    });
    return res.json();
  },
};

