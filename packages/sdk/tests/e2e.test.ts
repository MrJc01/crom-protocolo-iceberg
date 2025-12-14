/**
 * Testes E2E do Protocolo Iceberg
 *
 * Testa a integração completa: CLI → SDK → Daemon
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// Configuração
const DAEMON_PORT = 8421; // Porta diferente para testes
const DAEMON_URL = `http://localhost:${DAEMON_PORT}`;
const TEST_DATA_DIR = path.join(os.tmpdir(), "iceberg-e2e-test");

let daemonProcess: ChildProcess | null = null;

// Utilitário para fazer requests HTTP
async function apiRequest(
  endpoint: string,
  method = "GET",
  body?: any
): Promise<any> {
  const response = await fetch(`${DAEMON_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Aguardar daemon iniciar
async function waitForDaemon(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const health = await apiRequest("/health");
      if (health.status === "ok") return true;
    } catch {
      // Continuar tentando
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

describe("E2E: Protocolo Iceberg", () => {
  beforeAll(async () => {
    // Limpar dados de teste anteriores
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

    // Compilar daemon se necessário
    const daemonDir = path.resolve(__dirname, "../../daemon");
    const distPath = path.join(daemonDir, "dist/index.js");

    if (!fs.existsSync(distPath)) {
      console.log("Compilando daemon...");
      execSync("npm run build", { cwd: daemonDir, stdio: "inherit" });
    }

    // Iniciar daemon com porta e diretório de teste
    console.log(`Iniciando daemon na porta ${DAEMON_PORT}...`);
    daemonProcess = spawn(
      "node",
      [
        distPath,
        "--port",
        DAEMON_PORT.toString(),
        "--data-dir",
        TEST_DATA_DIR,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PORT: DAEMON_PORT.toString() },
      }
    );

    daemonProcess.stdout?.on("data", (data) => {
      console.log(`[daemon] ${data}`);
    });

    daemonProcess.stderr?.on("data", (data) => {
      console.error(`[daemon error] ${data}`);
    });

    // Aguardar daemon iniciar
    const started = await waitForDaemon();
    if (!started) {
      throw new Error("Daemon não iniciou a tempo");
    }

    console.log("Daemon iniciado com sucesso!");
  }, 60000); // Timeout de 60s para startup

  afterAll(async () => {
    // Encerrar daemon
    if (daemonProcess) {
      daemonProcess.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Limpar dados de teste
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  // ==========================================
  // TESTES DE HEALTH
  // ==========================================

  describe("Health Check", () => {
    it("deve retornar status ok", async () => {
      const health = await apiRequest("/health");

      expect(health.status).toBe("ok");
      expect(health.version).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // TESTES DE IDENTIDADE
  // ==========================================

  describe("Identidade", () => {
    it("deve retornar 404 quando não há identidade", async () => {
      await expect(apiRequest("/identity")).rejects.toThrow();
    });

    it("deve criar nova identidade", async () => {
      const result = await apiRequest("/identity", "POST", {});

      expect(result.publicKey).toMatch(/^ed25519:/);
      expect(result.mnemonic).toBeDefined();
      expect(result.mnemonic.split(" ").length).toBe(24);
    });

    it("deve retornar identidade após criação", async () => {
      const identity = await apiRequest("/identity");

      expect(identity.publicKey).toMatch(/^ed25519:/);
      expect(identity.createdAt).toBeDefined();
    });

    it("deve rejeitar criar nova identidade sem force", async () => {
      await expect(apiRequest("/identity", "POST", {})).rejects.toThrow();
    });

    it("deve permitir criar nova identidade com force", async () => {
      const result = await apiRequest("/identity", "POST", { force: true });

      expect(result.publicKey).toMatch(/^ed25519:/);
    });
  });

  // ==========================================
  // TESTES DE POSTS
  // ==========================================

  describe("Posts", () => {
    let testPostCid: string;

    it("deve criar post com sucesso", async () => {
      const result = await apiRequest("/posts", "POST", {
        title: "Teste E2E",
        body: "Este é um post de teste criado pelos testes E2E",
        region: "BR-SP-SAO_PAULO",
        category: "test",
      });

      expect(result.cid).toMatch(/^bafybei/);
      expect(result.status).toBe("created");
      expect(result.level).toBe(0);

      testPostCid = result.cid;
    });

    it("deve listar posts", async () => {
      const result = await apiRequest("/posts");

      expect(result.posts).toBeInstanceOf(Array);
      expect(result.posts.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("deve filtrar posts por região", async () => {
      const result = await apiRequest("/posts?region=BR-SP-SAO_PAULO");

      expect(result.posts.length).toBeGreaterThan(0);
      expect(result.posts[0].region).toBe("BR-SP-SAO_PAULO");
    });

    it("deve obter post específico", async () => {
      const post = await apiRequest(`/posts/${testPostCid}`);

      expect(post.cid).toBe(testPostCid);
      expect(post.title).toBe("Teste E2E");
      expect(post.votes).toBeDefined();
    });

    it("deve rejeitar criar post sem campos obrigatórios", async () => {
      await expect(
        apiRequest("/posts", "POST", { title: "Apenas título" })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // TESTES DE VOTOS
  // ==========================================

  describe("Votos", () => {
    let testPostCid: string;

    beforeAll(async () => {
      // Criar post para votar
      const result = await apiRequest("/posts", "POST", {
        title: "Post para votação",
        body: "Post criado para testar sistema de votos",
        region: "BR-RJ-RIO_DE_JANEIRO",
      });
      testPostCid = result.cid;
    });

    it("deve retornar votos zerados inicialmente", async () => {
      const votes = await apiRequest(`/votes/${testPostCid}`);

      expect(votes.up).toBe(0);
      expect(votes.down).toBe(0);
      expect(votes.reports).toBe(0);
      expect(votes.score).toBe(0);
    });

    it("deve rejeitar voto no próprio post", async () => {
      // O post foi criado pela identidade atual, então não pode votar
      await expect(
        apiRequest(`/votes/${testPostCid}`, "POST", { type: "up" })
      ).rejects.toThrow();
    });

    it("deve rejeitar tipo de voto inválido", async () => {
      await expect(
        apiRequest(`/votes/${testPostCid}`, "POST", { type: "invalid" })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // TESTES DE FLUXO COMPLETO
  // ==========================================

  describe("Fluxo Completo", () => {
    it("deve executar fluxo completo: criar post → listar → obter → verificar votos", async () => {
      // 1. Criar post
      const created = await apiRequest("/posts", "POST", {
        title: "Fluxo Completo",
        body: "Teste de fluxo completo do sistema",
        region: "BR-MG-BELO_HORIZONTE",
        category: "integration-test",
      });

      expect(created.cid).toBeDefined();

      // 2. Listar posts e verificar que está na lista
      const list = await apiRequest("/posts?region=BR-MG-BELO_HORIZONTE");

      const found = list.posts.find((p: any) => p.cid === created.cid);
      expect(found).toBeDefined();
      expect(found.title).toBe("Fluxo Completo");

      // 3. Obter post específico
      const post = await apiRequest(`/posts/${created.cid}`);

      expect(post.cid).toBe(created.cid);
      expect(post.level).toBe(0);
      expect(post.votes.score).toBe(0);

      // 4. Verificar votos
      const votes = await apiRequest(`/votes/${created.cid}`);

      expect(votes.up).toBe(0);
      expect(votes.down).toBe(0);
    });
  });
});
