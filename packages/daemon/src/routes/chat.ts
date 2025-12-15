/**
 * Chat API Routes
 * 
 * Endpoints para chat P2P privado entre usuários
 */

import { Router, Request, Response } from "express";
import { Storage, ChatMessage } from "../storage";
import * as crypto from "crypto";

const router = Router();

// Gerar ID para mensagens
function generateMessageId(): string {
  return "msg_" + crypto.randomBytes(16).toString("hex");
}

// GET /chat/conversations - Listar conversas
router.get("/conversations", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    const conversations = storage.getConversations(identity.publicKey);

    res.json({ conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chat/:peerPubKey - Histórico de conversa com um peer
router.get("/:peerPubKey", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { peerPubKey } = req.params;
    const { limit } = req.query;

    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    const messages = storage.getConversation(
      identity.publicKey,
      peerPubKey,
      limit ? parseInt(limit as string) : 100
    );

    // Marcar mensagens como lidas
    storage.markMessagesAsRead(identity.publicKey, peerPubKey);

    res.json({ 
      messages: messages.reverse(), // Ordem cronológica
      peer: peerPubKey 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chat/:peerPubKey - Enviar mensagem
router.post("/:peerPubKey", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { peerPubKey } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "content é obrigatório" });
    }

    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    // Não pode enviar mensagem para si mesmo
    if (peerPubKey === identity.publicKey) {
      return res.status(400).json({ error: "Não é possível enviar mensagem para si mesmo" });
    }

    const message: ChatMessage = {
      id: generateMessageId(),
      fromPubKey: identity.publicKey,
      toPubKey: peerPubKey,
      content: content.trim(), // TODO: Implementar criptografia E2E
      createdAt: Date.now(),
      read: false
    };

    storage.saveMessage(message);

    // TODO: Enviar via P2P para o destinatário

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chat/:peerPubKey/read - Marcar como lido
router.post("/:peerPubKey/read", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { peerPubKey } = req.params;

    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    storage.markMessagesAsRead(identity.publicKey, peerPubKey);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const chatRouter = router;
