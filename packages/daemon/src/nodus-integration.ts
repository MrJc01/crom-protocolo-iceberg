/**
 * Integração P2P Real com @nodus/core
 *
 * Este módulo integra o Iceberg com a rede P2P do Nodus.
 * Se @nodus/core não estiver disponível, usa o mock do p2p.ts.
 */

import { EventEmitter } from "events";
import { Storage, Post } from "./storage";
import { ConsensusEngine } from "./consensus";

// Tentar importar @nodus/core dinamicamente
let NodusNode: any = null;
try {
  // @ts-ignore - importação dinâmica opcional
  NodusNode = require("@nodus/core").NodusNode;
} catch {
  console.log("[P2P] @nodus/core não disponível, usando modo mock");
}

export interface NodusConfig {
  relays?: string[];
  identity?: {
    publicKey: string;
    secretKey: Uint8Array;
  };
}

export class NodusIntegration extends EventEmitter {
  private storage: Storage;
  private consensus: ConsensusEngine;
  private node: any = null;
  private connected = false;
  private config: NodusConfig;

  constructor(storage: Storage, consensus: ConsensusEngine, config: NodusConfig = {}) {
    super();
    this.storage = storage;
    this.consensus = consensus;
    this.config = {
      relays: config.relays || [
        "wss://relay1.iceberg.network",
        "ws://localhost:8080", // Relay local para dev
      ],
      ...config,
    };
  }

  async connect(): Promise<boolean> {
    if (!NodusNode) {
      console.log("[P2P] Modo mock ativo - sem sincronização real");
      this.connected = false;
      return false;
    }

    try {
      console.log("[P2P] Conectando à rede Nodus...");

      this.node = new NodusNode({
        relays: this.config.relays,
        identity: this.config.identity,
      });

      // Handlers de mensagens
      this.node.on("message", this.handleMessage.bind(this));
      this.node.on("peer:connect", (peer: any) => {
        console.log(`[P2P] Peer conectado: ${peer.id?.slice(0, 16)}...`);
        this.emit("peer:connect", peer);
      });

      await this.node.connect();
      this.connected = true;

      console.log("[P2P] ✅ Conectado à rede Nodus!");
      this.emit("connected");

      return true;
    } catch (error: any) {
      console.error("[P2P] Erro ao conectar:", error.message);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.node) {
      await this.node.disconnect();
    }
    this.connected = false;
    this.emit("disconnected");
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Broadcast de novo post para a rede
   */
  async broadcastPost(post: Post): Promise<void> {
    if (!this.connected || !this.node) {
      console.log("[P2P] Não conectado, post não propagado");
      return;
    }

    try {
      await this.node.broadcast({
        type: "iceberg:post",
        data: {
          cid: post.cid,
          title: post.title,
          body: post.body,
          author: post.author,
          region: post.region,
          category: post.category,
          level: post.level,
          createdAt: post.createdAt,
        },
      });

      console.log(`[P2P] Post ${post.cid.slice(0, 16)}... propagado`);
    } catch (error: any) {
      console.error("[P2P] Erro ao propagar post:", error.message);
    }
  }

  /**
   * Broadcast de voto para a rede
   */
  async broadcastVote(vote: {
    postCid: string;
    voter: string;
    type: "up" | "down" | "report";
  }): Promise<void> {
    if (!this.connected || !this.node) return;

    try {
      await this.node.broadcast({
        type: "iceberg:vote",
        data: vote,
      });

      console.log(`[P2P] Voto ${vote.type} em ${vote.postCid.slice(0, 16)}... propagado`);
    } catch (error: any) {
      console.error("[P2P] Erro ao propagar voto:", error.message);
    }
  }

  /**
   * Solicitar sincronização de posts de uma região
   */
  async requestSync(region?: string): Promise<void> {
    if (!this.connected || !this.node) return;

    try {
      await this.node.broadcast({
        type: "iceberg:sync:request",
        data: { region: region || "all", since: Date.now() - 86400000 }, // Últimas 24h
      });

      console.log(`[P2P] Sync solicitado para região: ${region || "todas"}`);
    } catch (error: any) {
      console.error("[P2P] Erro ao solicitar sync:", error.message);
    }
  }

  /**
   * Handler de mensagens recebidas da rede
   */
  private handleMessage(message: any): void {
    const { type, data, from } = message;

    switch (type) {
      case "iceberg:post":
        this.handleIncomingPost(data, from);
        break;

      case "iceberg:vote":
        this.handleIncomingVote(data, from);
        break;

      case "iceberg:sync:request":
        this.handleSyncRequest(data, from);
        break;

      case "iceberg:sync:response":
        this.handleSyncResponse(data, from);
        break;
    }
  }

  private handleIncomingPost(data: any, from: string): void {
    console.log(`[P2P] Recebido post de ${from.slice(0, 16)}...`);

    // Verificar se já temos o post
    const existing = this.storage.getPost(data.cid);
    if (existing) {
      console.log(`[P2P] Post ${data.cid.slice(0, 16)}... já existe`);
      return;
    }

    // Salvar post
    this.storage.createPost({
      cid: data.cid,
      title: data.title,
      body: data.body,
      author: data.author,
      region: data.region,
      category: data.category,
      level: data.level || 0,
      createdAt: data.createdAt,
    });

    console.log(`[P2P] Post ${data.cid.slice(0, 16)}... salvo localmente`);
    this.emit("post:received", data);
  }

  private handleIncomingVote(data: any, from: string): void {
    console.log(`[P2P] Recebido voto de ${from.slice(0, 16)}...`);

    // Verificar se post existe
    const post = this.storage.getPost(data.postCid);
    if (!post) {
      console.log(`[P2P] Post ${data.postCid.slice(0, 16)}... não encontrado`);
      return;
    }

    // Registrar voto
    this.storage.castVote({
      id: `${data.postCid}-${data.voter}`,
      postCid: data.postCid,
      voter: data.voter,
      type: data.type,
      weight: 1.0,
      createdAt: Date.now(),
    });

    // Recalcular nível
    this.consensus.recalculateLevel(data.postCid);

    this.emit("vote:received", data);
  }

  private async handleSyncRequest(data: any, from: string): Promise<void> {
    console.log(`[P2P] Sync request de ${from.slice(0, 16)}... para região: ${data.region}`);

    // Buscar posts locais
    const result = this.storage.listPosts({
      region: data.region === "all" ? undefined : data.region,
      limit: 100,
    });

    // Enviar resposta
    if (this.node) {
      await this.node.send(from, {
        type: "iceberg:sync:response",
        data: { posts: result.posts },
      });
    }
  }

  private handleSyncResponse(data: any, from: string): void {
    console.log(`[P2P] Sync response de ${from.slice(0, 16)}... com ${data.posts?.length || 0} posts`);

    for (const post of data.posts || []) {
      this.handleIncomingPost(post, from);
    }

    this.emit("sync:complete", { from, count: data.posts?.length || 0 });
  }

  /**
   * Estatísticas da rede
   */
  getStats(): { connected: boolean; peerCount: number; mode: string } {
    return {
      connected: this.connected,
      peerCount: this.node?.getPeers?.()?.length || 0,
      mode: NodusNode ? "nodus" : "mock",
    };
  }
}
