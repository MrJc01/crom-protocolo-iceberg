/**
 * Saved Posts API Routes
 * 
 * Endpoints para salvar e listar posts favoritos
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";

const router = Router();

// GET /saved - Listar posts salvos do usuário atual
router.get("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const identity = storage.getIdentity();
    
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const result = storage.getSavedPosts(identity.publicKey, limit, offset);
    
    // Adicionar contagem de votos e comentários para cada post
    const postsWithMeta = result.posts.map((post: any) => ({
      ...post,
      votes: storage.getVoteCounts(post.cid),
      commentCount: storage.countComments(post.cid),
    }));
    
    res.json({
      posts: postsWithMeta,
      total: result.total,
      hasMore: result.total > offset + result.posts.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /saved/:cid - Salvar um post
router.post("/:cid", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;
    
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    // Verificar se post existe
    const post = storage.getPost(cid);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }
    
    storage.savePost(identity.publicKey, cid);
    
    res.status(201).json({ 
      success: true, 
      message: "Post salvo com sucesso" 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /saved/:cid - Remover post dos salvos
router.delete("/:cid", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;
    
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    storage.unsavePost(identity.publicKey, cid);
    
    res.json({ 
      success: true, 
      message: "Post removido dos salvos" 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /saved/:cid/status - Verificar se post está salvo
router.get("/:cid/status", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;
    
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }
    
    const isSaved = storage.isPostSaved(identity.publicKey, cid);
    
    res.json({ saved: isSaved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const savedRouter = router;
