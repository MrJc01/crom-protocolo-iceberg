/**
 * Rotas P2P - Gerenciamento da rede
 */

import { Router, Request, Response } from "express";
import { getP2PNode } from "../p2p";

export const p2pRouter = Router();

/**
 * GET /p2p/status
 * Retorna status da conexão P2P
 */
p2pRouter.get("/status", (req: Request, res: Response) => {
  const p2p = getP2PNode();
  const stats = p2p.getStats();

  res.json({
    connected: stats.connected,
    peers: stats.peerCount,
    messagesSent: stats.messagesSent,
    region: stats.region,
    relays: ["wss://relay1.iceberg.network", "wss://relay2.iceberg.network"],
  });
});

/**
 * POST /p2p/connect
 * Conectar à rede P2P
 */
p2pRouter.post("/connect", async (req: Request, res: Response) => {
  const p2p = getP2PNode();

  if (p2p.isConnected()) {
    return res.json({ success: true, message: "Já conectado" });
  }

  try {
    await p2p.connect();
    res.json({ success: true, message: "Conectado à rede P2P" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /p2p/disconnect
 * Desconectar da rede P2P
 */
p2pRouter.post("/disconnect", async (req: Request, res: Response) => {
  const p2p = getP2PNode();

  if (!p2p.isConnected()) {
    return res.json({ success: true, message: "Já desconectado" });
  }

  try {
    await p2p.disconnect();
    res.json({ success: true, message: "Desconectado da rede P2P" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /p2p/peers
 * Lista peers conectados
 */
p2pRouter.get("/peers", (req: Request, res: Response) => {
  const p2p = getP2PNode();

  if (!p2p.isConnected()) {
    return res.json({ connected: false, peers: [] });
  }

  res.json({
    connected: true,
    peers: p2p.getPeers(),
    count: p2p.getPeers().length,
  });
});

/**
 * POST /p2p/sync
 * Solicitar sincronização de posts
 */
p2pRouter.post("/sync", async (req: Request, res: Response) => {
  const p2p = getP2PNode();
  const { region, since } = req.body;

  if (!p2p.isConnected()) {
    return res.status(400).json({ error: "Não conectado à rede P2P" });
  }

  try {
    await p2p.requestSync({ region, since });
    res.json({ success: true, message: "Sincronização solicitada" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
