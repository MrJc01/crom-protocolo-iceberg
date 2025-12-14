/**
 * Integração P2P com @nodus/core
 *
 * Este módulo abstrai a comunicação P2P para sincronização
 * de posts e votos entre nós do Iceberg.
 *
 * Baseado em: docs/11_INTEGRACAO_NODUS_CLI.md
 */

import { EventEmitter } from "events";

// ============================================
// TIPOS
// ============================================

export interface P2PMessage {
  type: "post" | "vote" | "sync" | "identity";
  payload: any;
  from: string;
  timestamp: number;
  signature?: string;
}

export interface P2PConfig {
  relays?: string[];
  region?: string;
  identity?: {
    publicKey: string;
    secretKey: Uint8Array;
  };
}

// ============================================
// P2P NODE (Wrapper para NodusNode)
// ============================================

/**
 * Nó P2P do Iceberg
 *
 * Por enquanto, esta é uma implementação mock que
 * simula a comunicação P2P. Quando @nodus/core estiver
 * integrado, esta classe irá delegar para NodusNode.
 */
export class IcebergP2PNode extends EventEmitter {
  private config: P2PConfig;
  private connected: boolean = false;
  private peers: Set<string> = new Set();
  private messageQueue: P2PMessage[] = [];

  constructor(config: P2PConfig = {}) {
    super();
    this.config = {
      relays: config.relays || [
        "wss://relay1.iceberg.network",
        "wss://relay2.iceberg.network",
      ],
      region: config.region || "BR",
      ...config,
    };
  }

  /**
   * Conectar à rede P2P
   */
  async connect(): Promise<void> {
    console.log("[P2P] Conectando à rede Iceberg...");
    console.log(`[P2P] Relays: ${this.config.relays?.join(", ")}`);
    console.log(`[P2P] Região: ${this.config.region}`);

    // TODO: Integrar com NodusNode real
    // const nodus = new NodusNode({ relays: this.config.relays });
    // await nodus.connect();

    // Simular conexão
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.connected = true;
    this.emit("connected");
    console.log("[P2P] ✅ Conectado à rede!");
  }

  /**
   * Desconectar da rede
   */
  async disconnect(): Promise<void> {
    console.log("[P2P] Desconectando...");
    this.connected = false;
    this.peers.clear();
    this.emit("disconnected");
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Obter lista de peers conectados
   */
  getPeers(): string[] {
    return Array.from(this.peers);
  }

  /**
   * Broadcast de mensagem para a rede
   */
  async broadcast(message: Omit<P2PMessage, "timestamp">): Promise<void> {
    if (!this.connected) {
      throw new Error("Não conectado à rede P2P");
    }

    const fullMessage: P2PMessage = {
      ...message,
      timestamp: Date.now(),
    };

    console.log(`[P2P] Broadcasting: ${message.type}`);

    // TODO: Enviar via NodusNode
    // await this.nodus.broadcast(message);

    // Simular broadcast (para desenvolvimento)
    this.messageQueue.push(fullMessage);
    this.emit("message:sent", fullMessage);
  }

  /**
   * Broadcast de novo post
   */
  async broadcastPost(post: {
    cid: string;
    title: string;
    body: string;
    region: string;
    author: string;
  }): Promise<void> {
    await this.broadcast({
      type: "post",
      payload: post,
      from: post.author,
    });
  }

  /**
   * Broadcast de voto
   */
  async broadcastVote(vote: {
    postCid: string;
    type: "up" | "down" | "report";
    voter: string;
  }): Promise<void> {
    await this.broadcast({
      type: "vote",
      payload: vote,
      from: vote.voter,
    });
  }

  /**
   * Solicitar sincronização de posts
   */
  async requestSync(options?: { region?: string; since?: number }): Promise<void> {
    await this.broadcast({
      type: "sync",
      payload: {
        region: options?.region || this.config.region,
        since: options?.since || 0,
      },
      from: this.config.identity?.publicKey || "anonymous",
    });
  }

  /**
   * Handler de mensagens recebidas
   */
  private handleMessage(message: P2PMessage): void {
    console.log(`[P2P] Recebido: ${message.type} de ${message.from.slice(0, 16)}...`);

    switch (message.type) {
      case "post":
        this.emit("post:received", message.payload);
        break;
      case "vote":
        this.emit("vote:received", message.payload);
        break;
      case "sync":
        this.emit("sync:requested", message.payload);
        break;
      case "identity":
        this.emit("identity:received", message.payload);
        break;
    }

    this.emit("message", message);
  }

  /**
   * Obter estatísticas da rede
   */
  getStats(): {
    connected: boolean;
    peerCount: number;
    messagesSent: number;
    region: string;
  } {
    return {
      connected: this.connected,
      peerCount: this.peers.size,
      messagesSent: this.messageQueue.length,
      region: this.config.region || "unknown",
    };
  }
}

// Singleton para uso global
let p2pNode: IcebergP2PNode | null = null;

export function getP2PNode(config?: P2PConfig): IcebergP2PNode {
  if (!p2pNode) {
    p2pNode = new IcebergP2PNode(config);
  }
  return p2pNode;
}
