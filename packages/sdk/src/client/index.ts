/**
 * Cliente HTTP do SDK Iceberg
 *
 * Comunicação com o daemon local.
 */

export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export class IcebergClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:8420";
    this.timeout = config.timeout || 10000;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Timeout após ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==========================================
  // HEALTH
  // ==========================================

  async health(): Promise<{ status: string; version: string; uptime: number }> {
    const res = await this.request<any>("/health");
    if (!res.ok) throw new Error("Daemon não disponível");
    return res.data;
  }

  // ==========================================
  // IDENTITY
  // ==========================================

  async getIdentity(): Promise<{ publicKey: string; createdAt: number }> {
    const res = await this.request<any>("/identity");
    if (!res.ok) throw new Error(res.data.error || "Nenhuma identidade");
    return res.data;
  }

  async createIdentity(force = false): Promise<{
    publicKey: string;
    mnemonic?: string;
  }> {
    const res = await this.request<any>("/identity", {
      method: "POST",
      body: JSON.stringify({ force }),
    });
    if (!res.ok) throw new Error(res.data.error || "Erro ao criar identidade");
    return res.data;
  }

  // ==========================================
  // POSTS
  // ==========================================

  async listPosts(options?: {
    region?: string;
    level?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    posts: any[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.region) params.append("region", options.region);
    if (options?.level !== undefined) params.append("level", options.level.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const res = await this.request<any>(`/posts?${params}`);
    return res.data;
  }

  async getPost(cid: string): Promise<any> {
    const res = await this.request<any>(`/posts/${cid}`);
    if (!res.ok) throw new Error(res.data.error || "Post não encontrado");
    return res.data;
  }

  async createPost(data: {
    title: string;
    body: string;
    region: string;
    category?: string;
  }): Promise<{ cid: string; status: string; level: number }> {
    const res = await this.request<any>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(res.data.error || "Erro ao criar post");
    return res.data;
  }

  async deletePost(cid: string): Promise<void> {
    const res = await this.request<any>(`/posts/${cid}`, { method: "DELETE" });
    if (!res.ok) throw new Error(res.data.error || "Erro ao deletar post");
  }

  // ==========================================
  // VOTES
  // ==========================================

  async getVotes(cid: string): Promise<{
    up: number;
    down: number;
    reports: number;
    score: number;
    myVote?: { type: string; timestamp: number };
  }> {
    const res = await this.request<any>(`/votes/${cid}`);
    if (!res.ok) throw new Error(res.data.error || "Erro ao obter votos");
    return res.data;
  }

  async vote(
    cid: string,
    type: "up" | "down" | "report"
  ): Promise<{ success: boolean; yourVote: string; newScore: number }> {
    const res = await this.request<any>(`/votes/${cid}`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error(res.data.error || "Erro ao votar");
    return res.data;
  }
}

// Singleton
let client: IcebergClient | null = null;

export function getClient(config?: ClientConfig): IcebergClient {
  if (!client) {
    client = new IcebergClient(config);
  }
  return client;
}

export default IcebergClient;
