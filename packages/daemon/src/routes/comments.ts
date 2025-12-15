/**
 * Comments API Routes
 * 
 * Endpoints para comentários em posts
 */

import { Router, Request, Response } from "express";
import { Storage, Comment } from "../storage";
import * as crypto from "crypto";

const router = Router();

// Gerar CID simples para comentários
function generateCommentCid(): string {
  return "comment_" + crypto.randomBytes(16).toString("hex");
}

// GET /posts/:postCid/comments - Listar comentários de um post
router.get("/:postCid/comments", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { postCid } = req.params;

    // Verificar se post existe
    const post = storage.getPost(postCid);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const comments = storage.listComments(postCid);
    
    // Organizar em árvore (threads)
    const rootComments = comments.filter(c => !c.parentCid);
    const repliesMap = new Map<string, Comment[]>();
    
    comments.forEach(c => {
      if (c.parentCid) {
        const replies = repliesMap.get(c.parentCid) || [];
        replies.push(c);
        repliesMap.set(c.parentCid, replies);
      }
    });

    // Adicionar replies a cada comentário
    const buildTree = (comment: Comment): any => ({
      ...comment,
      replies: (repliesMap.get(comment.cid) || []).map(buildTree)
    });

    const tree = rootComments.map(buildTree);

    res.json({
      comments: tree,
      total: comments.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /posts/:postCid/comments - Criar comentário
router.post("/:postCid/comments", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { postCid } = req.params;
    const { body, parentCid } = req.body;

    // Verificar se post existe
    const post = storage.getPost(postCid);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    // Verificar parentCid se fornecido
    if (parentCid) {
      const parentComment = storage.getComment(parentCid);
      if (!parentComment) {
        return res.status(404).json({ error: "Comentário pai não encontrado" });
      }
    }

    // Obter identidade do autor
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada. Crie uma primeiro." });
    }

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: "Corpo do comentário é obrigatório" });
    }

    const now = Date.now();
    const comment: Comment = {
      cid: generateCommentCid(),
      postCid,
      parentCid: parentCid || null,
      body: body.trim(),
      author: identity.publicKey,
      createdAt: now,
      updatedAt: now
    };

    storage.createComment(comment);

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /comments/:cid - Deletar comentário (apenas autor)
router.delete("/:cid", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;

    const comment = storage.getComment(cid);
    if (!comment) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const identity = storage.getIdentity();
    if (!identity || identity.publicKey !== comment.author) {
      return res.status(403).json({ error: "Apenas o autor pode deletar o comentário" });
    }

    storage.deleteComment(cid);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /comments/:cid/vote - Votar em comentário
router.post("/:cid/vote", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;
    const { type } = req.body;

    if (!type || !["up", "down"].includes(type)) {
      return res.status(400).json({ error: "Tipo de voto inválido. Use 'up' ou 'down'." });
    }

    const comment = storage.getComment(cid);
    if (!comment) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    const voteId = `${cid}_${identity.publicKey}`;
    storage.castCommentVote({
      id: voteId,
      commentCid: cid,
      voter: identity.publicKey,
      type: type as "up" | "down"
    });

    const counts = storage.getCommentVoteCounts(cid);
    res.json({ success: true, votes: counts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /comments/:cid/votes - Obter votos de um comentário
router.get("/:cid/votes", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;

    const comment = storage.getComment(cid);
    if (!comment) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const counts = storage.getCommentVoteCounts(cid);
    
    // Verificar voto do usuário atual se logado
    const identity = storage.getIdentity();
    let myVote = null;
    if (identity) {
      myVote = storage.getCommentVote(cid, identity.publicKey);
    }

    res.json({ 
      ...counts,
      myVote: myVote?.type || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const commentsRouter = router;

