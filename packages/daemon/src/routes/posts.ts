/**
 * Rota /posts - CRUD de posts/denúncias
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export const postsRouter = Router();

/**
 * GET /posts - Listar posts
 */
postsRouter.get("/", (req: Request, res: Response) => {
  const storage = (req as any).storage;

  const options = {
    region: req.query.region as string | undefined,
    level: req.query.level ? parseInt(req.query.level as string) : undefined,
    author: req.query.author as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const result = storage.listPosts(options);

  // Adicionar contagem de votos e comentários para cada post
  const postsWithMeta = result.posts.map((post: any) => ({
    ...post,
    votes: storage.getVoteCounts(post.cid),
    commentCount: storage.countComments(post.cid),
  }));

  res.json({
    posts: postsWithMeta,
    total: result.total,
    hasMore: result.total > options.offset + result.posts.length,
  });
});

/**
 * GET /posts/:cid - Obter post específico
 */
postsRouter.get("/:cid", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;

  const post = storage.getPost(cid);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  // Adicionar votos e contagem de comentários
  const votes = storage.getVoteCounts(cid);
  const commentCount = storage.countComments(cid);

  res.json({
    ...post,
    votes,
    commentCount,
  });
});

/**
 * POST /posts - Criar novo post
 * Suporta: scheduledAt, autoArchiveAfterDays, btcBounty
 */
postsRouter.post("/", (req: Request, res: Response) => {
  const storage = (req as any).storage;

  const { title, body, region, category, scheduledAt, autoArchiveAfterDays, btcBounty } = req.body;

  // Validação
  if (!title || !body || !region) {
    return res.status(400).json({
      error: "Campos obrigatórios: title, body, region",
    });
  }

  // Verificar se tem identidade configurada
  const identity = storage.getIdentity();
  if (!identity) {
    return res.status(401).json({
      error: "Nenhuma identidade configurada. Use POST /identity primeiro.",
    });
  }

  // Gerar CID (hash do conteúdo)
  const content = JSON.stringify({ title, body, region, category, timestamp: Date.now() });
  const cid = "bafybei" + crypto.createHash("sha256").update(content).digest("hex").slice(0, 46);

  // Determinar visibilidade (oculto se agendado para futuro)
  const now = Date.now();
  const isScheduled = scheduledAt && scheduledAt > now;
  const isVisible = !isScheduled;

  try {
    const post = storage.createPost({
      cid,
      title,
      body,
      author: identity.publicKey,
      region,
      category,
      level: 0, // Começa no nível 0
      createdAt: now,
      scheduledAt: scheduledAt || null,
      autoArchiveAfterDays: autoArchiveAfterDays || null,
      isVisible: isVisible ? 1 : 0,
      btcBounty: btcBounty || null,
    });

    // Extrair e salvar hashtags do corpo do post
    const hashtags = storage.extractAndSaveHashtags(cid, body);

    res.status(201).json({
      cid: post.cid,
      status: isScheduled ? "scheduled" : "created",
      level: post.level,
      timestamp: post.createdAt,
      scheduledAt: scheduledAt || null,
      btcBounty: btcBounty || null,
      hashtags,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

/**
 * PUT /posts/:cid - Editar post (apenas autor, apenas se nível < 2)
 */
postsRouter.put("/:cid", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;
  const { title, body, scheduledAt, autoArchiveAfterDays, btcBounty } = req.body;

  const post = storage.getPost(cid);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  // Verificar se é o autor
  const identity = storage.getIdentity();
  if (!identity || post.author !== identity.publicKey) {
    return res.status(403).json({ error: "Apenas o autor pode editar o post" });
  }

  // Não permitir edição de posts nível 2+
  if (post.level >= 2) {
    return res.status(403).json({
      error: "Posts nível 2+ (surface/legacy) não podem ser editados",
    });
  }

  // Atualizar campos permitidos
  try {
    storage.db.prepare(`
      UPDATE posts SET 
        title = COALESCE(?, title),
        body = COALESCE(?, body),
        scheduledAt = COALESCE(?, scheduledAt),
        autoArchiveAfterDays = COALESCE(?, autoArchiveAfterDays),
        btcBounty = COALESCE(?, btcBounty),
        updatedAt = ?
      WHERE cid = ?
    `).run(
      title || null,
      body || null,
      scheduledAt || null,
      autoArchiveAfterDays || null,
      btcBounty || null,
      Date.now(),
      cid
    );

    res.json({ success: true, message: "Post atualizado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar post" });
  }
});

/**
 * POST /posts/:cid/archive - Arquivar post manualmente
 */
postsRouter.post("/:cid/archive", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;

  const post = storage.getPost(cid);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  const identity = storage.getIdentity();
  if (!identity || post.author !== identity.publicKey) {
    return res.status(403).json({ error: "Apenas o autor pode arquivar o post" });
  }

  try {
    storage.db.prepare("UPDATE posts SET isVisible = 0, updatedAt = ? WHERE cid = ?")
      .run(Date.now(), cid);

    res.json({ success: true, message: "Post arquivado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao arquivar post" });
  }
});

/**
 * DELETE /posts/:cid - Remover post (apenas autor)
 */
postsRouter.delete("/:cid", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;

  const post = storage.getPost(cid);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  // Verificar se é o autor
  const identity = storage.getIdentity();
  if (!identity || post.author !== identity.publicKey) {
    return res.status(403).json({ error: "Apenas o autor pode remover o post" });
  }

  // Não permitir remoção de posts nível 3
  if (post.level >= 3) {
    return res.status(403).json({
      error: "Posts nível 3 (histórico) não podem ser removidos",
    });
  }

  storage.deletePost(cid);

  res.json({ success: true, message: "Post removido" });
});
