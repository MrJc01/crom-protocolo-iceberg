/**
 * @iceberg/daemon - Servidor Principal
 *
 * Daemon local que serve API HTTP e gerencia storage.
 * Baseado na documentação: docs/02_ARQUITETURA_DO_SISTEMA.md
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { Storage } from "./storage";
import { postsRouter } from "./routes/posts";
import { votesRouter } from "./routes/votes";
import { identityRouter } from "./routes/identity";
import { healthRouter } from "./routes/health";

const DEFAULT_PORT = 8420;

export interface DaemonConfig {
  port?: number;
  dataDir?: string;
}

export class IcebergDaemon {
  private app: Express;
  private storage: Storage;
  private port: number;

  constructor(config: DaemonConfig = {}) {
    this.port = config.port || DEFAULT_PORT;
    this.app = express();

    // Inicializar storage
    this.storage = new Storage(config.dataDir);

    // Middleware
    this.app.use(cors());
    this.app.use(express.json());

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });

    // Injetar storage nas rotas
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      (req as any).storage = this.storage;
      next();
    });

    // Rotas
    this.app.use("/health", healthRouter);
    this.app.use("/identity", identityRouter);
    this.app.use("/posts", postsRouter);
    this.app.use("/votes", votesRouter);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Endpoint não encontrado" });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("Erro:", err.message);
      res.status(500).json({ error: err.message });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                 ICEBERG DAEMON v0.1.0                 ║
╠═══════════════════════════════════════════════════════╣
║  API local rodando em: http://localhost:${this.port}          ║
║                                                       ║
║  Endpoints disponíveis:                               ║
║    GET  /health           - Status do daemon          ║
║    GET  /identity         - Identidade atual          ║
║    POST /identity         - Criar identidade          ║
║    GET  /posts            - Listar posts              ║
║    POST /posts            - Criar post                ║
║    GET  /posts/:cid       - Obter post                ║
║    GET  /votes/:cid       - Votos de um post          ║
║    POST /votes/:cid       - Votar em post             ║
╚═══════════════════════════════════════════════════════╝
`);
        resolve();
      });
    });
  }

  getStorage(): Storage {
    return this.storage;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const daemon = new IcebergDaemon();
  daemon.start().catch(console.error);
}

export default IcebergDaemon;
