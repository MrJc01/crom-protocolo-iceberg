/**
 * Scheduled Posts API Routes
 * 
 * Endpoints para gerenciar posts agendados
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";
import * as crypto from "crypto";

const router = Router();

// GET /scheduled - Listar posts agendados do usuário atual
router.get("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const scheduledPosts = storage.getScheduledPosts(identity.publicKey);
    
    res.json({
      posts: scheduledPosts,
      total: scheduledPosts.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scheduled - Criar post agendado
router.post("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const { title, body, region, category, publishAt, endPostAfterDays } = req.body;
    
    if (!title || !body || !region || !publishAt) {
      return res.status(400).json({ 
        error: "Campos obrigatórios: title, body, region, publishAt" 
      });
    }
    
    // Validar que publishAt é no futuro
    if (publishAt <= Date.now()) {
      return res.status(400).json({ 
        error: "publishAt deve ser uma data futura" 
      });
    }
    
    const id = crypto.randomBytes(16).toString("hex");
    
    storage.createScheduledPost({
      id,
      title,
      body,
      region,
      category,
      author: identity.publicKey,
      publishAt,
      endPostAfterDays
    });
    
    res.status(201).json({
      id,
      status: "pending",
      publishAt,
      message: "Post agendado com sucesso"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /scheduled/:id - Atualizar post agendado
router.put("/:id", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { id } = req.params;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const scheduledPosts = storage.getScheduledPosts(identity.publicKey);
    const post = scheduledPosts.find((p: any) => p.id === id);
    
    if (!post) {
      return res.status(404).json({ error: "Post agendado não encontrado" });
    }
    
    // Atualizar usando SQL diretamente
    const { title, body, region, category, publishAt, endPostAfterDays } = req.body;
    
    (storage as any).db.prepare(`
      UPDATE scheduled_posts SET
        title = COALESCE(?, title),
        body = COALESCE(?, body),
        region = COALESCE(?, region),
        category = COALESCE(?, category),
        publishAt = COALESCE(?, publishAt),
        endPostAfterDays = COALESCE(?, endPostAfterDays)
      WHERE id = ? AND author = ?
    `).run(
      title || null,
      body || null,
      region || null,
      category || null,
      publishAt || null,
      endPostAfterDays || null,
      id,
      identity.publicKey
    );
    
    res.json({ success: true, message: "Post agendado atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /scheduled/:id - Cancelar post agendado
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { id } = req.params;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const scheduledPosts = storage.getScheduledPosts(identity.publicKey);
    const post = scheduledPosts.find((p: any) => p.id === id);
    
    if (!post) {
      return res.status(404).json({ error: "Post agendado não encontrado" });
    }
    
    storage.deleteScheduledPost(id);
    
    res.json({ success: true, message: "Post agendado cancelado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scheduled/:id/publish - Publicar imediatamente
router.post("/:id/publish", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { id } = req.params;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const scheduledPosts = storage.getScheduledPosts(identity.publicKey);
    const scheduledPost = scheduledPosts.find((p: any) => p.id === id);
    
    if (!scheduledPost) {
      return res.status(404).json({ error: "Post agendado não encontrado" });
    }
    
    // Criar o post real
    const content = JSON.stringify({ 
      title: scheduledPost.title, 
      body: scheduledPost.body, 
      region: scheduledPost.region,
      timestamp: Date.now() 
    });
    const cid = "bafybei" + crypto.createHash("sha256").update(content).digest("hex").slice(0, 46);
    
    const now = Date.now();
    storage.createPost({
      cid,
      title: scheduledPost.title,
      body: scheduledPost.body,
      author: identity.publicKey,
      region: scheduledPost.region,
      category: scheduledPost.category,
      level: 0,
      createdAt: now,
    });
    
    // Extrair hashtags
    storage.extractAndSaveHashtags(cid, scheduledPost.body);
    
    // Marcar como publicado
    storage.updateScheduledPostStatus(id, "published");
    
    res.json({ 
      success: true, 
      cid,
      message: "Post publicado com sucesso" 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const scheduledRouter = router;
