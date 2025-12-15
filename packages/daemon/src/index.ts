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
import { commentsRouter } from "./routes/comments";
import { reportsRouter } from "./routes/reports";
import { chatRouter } from "./routes/chat";
import { consensusRouter } from "./routes/consensus";
import { metricsRouter, metricsMiddleware } from "./routes/metrics";
import { securityRouter } from "./routes/security";
import { networkRouter } from "./routes/network";
import { hashtagsRouter } from "./routes/hashtags";
import { savedRouter } from "./routes/saved";
import { scheduledRouter } from "./routes/scheduled";
import { bitcoinRouter } from "./bitcoin";
import { 
  generalLimiter, 
  postCreationLimiter, 
  voteLimiter, 
  reportLimiter, 
  chatLimiter 
} from "./middleware/rateLimit";
import { logger, requestLogger } from "./logger";

const DEFAULT_PORT = 8420;

export interface DaemonConfig {
  port?: number;
  dataDir?: string;
  enableRateLimiting?: boolean;
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
    logger.info({ dataDir: config.dataDir || "~/.iceberg" }, "Storage initialized");

    // Middleware
    this.app.use(cors());
    this.app.use(express.json());

    // Structured logging middleware
    this.app.use(requestLogger());

    // Metrics collection middleware
    this.app.use(metricsMiddleware());

    // Rate limiting (opcional, habilitado em produção)
    if (config.enableRateLimiting || process.env.NODE_ENV === "production") {
      this.app.use(generalLimiter);
      logger.info("Rate limiting enabled");
    }

    // Injetar storage nas rotas
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      (req as any).storage = this.storage;
      next();
    });

    // Rotas
    this.app.use("/health", healthRouter);
    this.app.use("/identity", identityRouter);
    this.app.use("/posts", postsRouter);
    this.app.use("/posts", commentsRouter); // /posts/:postCid/comments
    this.app.use("/votes", votesRouter);
    this.app.use("/reports", reportsRouter);
    this.app.use("/chat", chatRouter);
    this.app.use("/consensus", consensusRouter);
    this.app.use("/metrics", metricsRouter);
    this.app.use("/security", securityRouter);
    this.app.use("/network", networkRouter);
    this.app.use("/hashtags", hashtagsRouter);
    this.app.use("/saved", savedRouter);
    this.app.use("/scheduled", scheduledRouter);
    this.app.use("/bitcoin", bitcoinRouter);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Endpoint não encontrado" });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error({ error: err.message, stack: err.stack }, "Request error");
      res.status(500).json({ error: err.message });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        logger.info({ port: this.port, version: "0.2.0" }, "Iceberg Daemon started");
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                 ICEBERG DAEMON v0.2.0                     ║
╠═══════════════════════════════════════════════════════════╣
║  API local rodando em: http://localhost:${this.port}              ║
║                                                           ║
║  Endpoints disponíveis:                                   ║
║    GET  /health                - Status do daemon         ║
║    GET  /identity              - Identidade atual         ║
║    POST /identity              - Criar identidade         ║
║    GET  /posts                 - Listar posts             ║
║    POST /posts                 - Criar post               ║
║    GET  /posts/:cid            - Obter post               ║
║    GET  /posts/:cid/comments   - Comentários do post      ║
║    POST /posts/:cid/comments   - Criar comentário         ║
║    GET  /votes/:cid            - Votos de um post         ║
║    POST /votes/:cid            - Votar em post            ║
║    POST /reports               - Criar denúncia           ║
║    GET  /reports               - Listar denúncias         ║
║    GET  /chat/conversations    - Listar conversas         ║
║    GET  /chat/:pubKey          - Histórico de chat        ║
║    POST /chat/:pubKey          - Enviar mensagem          ║
╚═══════════════════════════════════════════════════════════╝
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
