/**
 * Testes do Daemon (Standalone)
 *
 * Testes que rodam contra um daemon já iniciado.
 * Execute: node dist/index.js (no packages/daemon)
 * Depois: npm run test:daemon
 */

import { describe, it, expect } from "vitest";

const DAEMON_URL = process.env.DAEMON_URL || "http://localhost:8420";

async function api(endpoint: string, method = "GET", body?: any): Promise<any> {
  const response = await fetch(`${DAEMON_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

describe("Daemon API Tests", () => {
  describe("GET /health", () => {
    it("retorna status ok", async () => {
      const health = await api("/health");
      expect(health.status).toBe("ok");
      expect(health.version).toBe("0.1.0");
    });
  });

  describe("POST /identity", () => {
    it("cria ou retorna identidade existente", async () => {
      try {
        const result = await api("/identity", "POST", { force: true });
        expect(result.publicKey).toMatch(/^ed25519:/);
        expect(result.mnemonic.split(" ").length).toBe(24);
      } catch (error: any) {
        // Se já existe, também é ok
        expect(error.message).toContain("existe");
      }
    });
  });

  describe("GET /identity", () => {
    it("retorna identidade atual", async () => {
      const identity = await api("/identity");
      expect(identity.publicKey).toMatch(/^ed25519:/);
    });
  });

  describe("POST /posts", () => {
    it("cria post com sucesso", async () => {
      const result = await api("/posts", "POST", {
        title: `Teste ${Date.now()}`,
        body: "Conteúdo de teste",
        region: "BR-SP-SAO_PAULO",
      });

      expect(result.cid).toMatch(/^bafybei/);
      expect(result.level).toBe(0);
    });

    it("rejeita post sem campos obrigatórios", async () => {
      await expect(api("/posts", "POST", { title: "apenas" })).rejects.toThrow();
    });
  });

  describe("GET /posts", () => {
    it("lista posts", async () => {
      const result = await api("/posts");
      expect(result.posts).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("filtra por região", async () => {
      const result = await api("/posts?region=BR-SP-SAO_PAULO");
      for (const post of result.posts) {
        expect(post.region).toBe("BR-SP-SAO_PAULO");
      }
    });
  });

  describe("GET /posts/:cid", () => {
    it("retorna 404 para CID inexistente", async () => {
      await expect(api("/posts/bafybeiinvalid123")).rejects.toThrow();
    });
  });

  describe("GET /votes/:cid", () => {
    it("retorna votos de um post existente", async () => {
      // Primeiro criar um post
      const post = await api("/posts", "POST", {
        title: `Vote Test ${Date.now()}`,
        body: "Post para testar votos",
        region: "BR-RJ",
      });

      const votes = await api(`/votes/${post.cid}`);
      expect(votes.up).toBe(0);
      expect(votes.down).toBe(0);
      expect(votes.score).toBe(0);
    });
  });
});
